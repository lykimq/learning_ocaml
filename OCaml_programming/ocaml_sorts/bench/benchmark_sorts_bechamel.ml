open Bechamel
open Ocaml_sorts.Sorts
open Toolkit

(* Generate random lists for benchmarking *)
let generate_random_list n =
  let rec aux acc n =
    if n <= 0 then acc else aux (Random.int 1000 :: acc) (n - 1)
  in
  aux [] n

let benchmark_sorts () =
  let sizes = [ 100; 1000; 5000; 10000 ] in
  let test_sort name sort_fn n =
    let data = generate_random_list n in
    let test = Staged.stage (fun () -> ignore (sort_fn data)) in
    Test.make ~name test
  in

  let tests =
    List.concat_map
      (fun size ->
        [
          test_sort
            (Printf.sprintf "Bubble Sort (n=%d)" size)
            Sorts.bubble_sort size;
          test_sort
            (Printf.sprintf "Insertion Sort (n=%d)" size)
            Sorts.insert_sort size;
          test_sort
            (Printf.sprintf "Quick Sort (n=%d)" size)
            Sorts.quick_sort size;
          test_sort
            (Printf.sprintf "Merge Sort (n=%d)" size)
            Sorts.merge_sort size;
          test_sort (Printf.sprintf "Tim Sort (n=%d)" size) Sorts.timsort size;
          test_sort
            (Printf.sprintf "Heap Sort (n=%d)" size)
            (fun lst -> Array.to_list (Sorts.heap_sort (Array.of_list lst)))
            size;
        ])
      sizes
  in
  (* Run the benchmark and collect results
     [Bechamel] asks 3 things:
     - What you want to record ([instances])
     - How you want to analyse ([ols])
     - How you want to benchmark your test ([cfg])
  *)
  let instances =
    Instance.[ minor_allocated; major_allocated; monotonic_clock ]
  in
  let cfg = Benchmark.cfg ~limit:2000 ~quota:(Time.second 2.0) () in
  let ols =
    Analyze.ols ~bootstrap:0 ~r_square:true ~predictors:Measure.[| run |]
  in
  (* [raw_results] is what the benchmark produced. This is used to show graphs
     or to let the user (with [Measurement_raw] to infer something else than what
     [ols] did.) *)
  let raw_results =
    Benchmark.all cfg instances
      (Test.make_grouped ~name:"sorts" ~fmt:"%s %s" tests)
  in
  (* [results] is what the analyse can infer. It is mostly what we want: a
     synthesis of /samples/ *)
  let results =
    List.map (fun instance -> Analyze.all ols instance raw_results) instances
  in
  (* Merging the results *)
  let results = Analyze.merge ols instances results in
  (results, raw_results)

let img (window, results) =
  Bechamel_notty.Multiple.image_of_ols_results ~rect:window
    ~predictor:Measure.run results

let () =
  let open Notty_unix in
  let window =
    match winsize Unix.stdout with
    | Some (w, h) -> { Bechamel_notty.w; h }
    | None -> { Bechamel_notty.w = 80; h = 1 }
  in
  let results, _ = benchmark_sorts () in
  img (window, results) |> eol |> output_image
