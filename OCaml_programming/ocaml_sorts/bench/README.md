# Sorting Algorithms Benchmark Report

## Overview
This report presents the performance of various sorting algorithms tested on
input sizes of 100, 1000, 5000, and 10,000 elements. The tests were run on an
"Intel Core i7-8665U CPU @ 1.90 GHz" with 8 cores, 16GB of memory, and Ubuntu
22.04.5 LTS (64-bit). The benchmarks measured execution time, memory usage, and
other performance metrics to compare the algorithms.

```
perf stat dune exec ./bench/benchmark_sorts.exe
```

## Summary of Results

Raw output:

```
┌──────────────────────────┬────────────────┬─────────────────┬─────────────────┬─────────────────┬────────────┐
│ Name                     │       Time/Run │         mWd/Run │        mjWd/Run │        Prom/Run │ Percentage │
├──────────────────────────┼────────────────┼─────────────────┼─────────────────┼─────────────────┼────────────┤
│ Bubble Sort (n=100)      │       741.94us │      77_291.00w │         145.84w │         145.84w │      0.02% │
│ Insertion Sort (n=100)   │       448.54us │       8_399.00w │           4.29w │           4.29w │      0.01% │
│ Quick Sort (n=100)       │       436.16us │       4_411.00w │           4.92w │           4.92w │      0.01% │
│ Merge Sort (n=100)       │       647.09us │       7_730.00w │          11.66w │          11.66w │      0.02% │
│ Tim Sort (n=100)         │       586.01us │      12_340.00w │          15.94w │          15.94w │      0.02% │
│ Bubble Sort (n=1000)     │    17_475.65us │   8_808_212.00w │     169_589.12w │     169_589.12w │      0.57% │
│ Insertion Sort (n=1000)  │     4_402.08us │     768_515.00w │       3_905.44w │       3_905.44w │      0.14% │
│ Quick Sort (n=1000)      │     1_425.92us │      69_337.00w │         809.63w │         809.63w │      0.05% │
│ Merge Sort (n=1000)      │     1_366.74us │     115_328.00w │       1_829.89w │       1_829.89w │      0.04% │
│ Tim Sort (n=1000)        │     1_634.58us │     163_108.00w │       2_282.75w │       2_282.75w │      0.05% │
│ Bubble Sort (n=5000)     │   604_273.18us │ 222_150_338.00w │  21_586_396.71w │  21_586_396.71w │     19.54% │
│ Insertion Sort (n=5000)  │    90_035.44us │  19_048_334.00w │     472_860.18w │     472_860.18w │      2.91% │
│ Quick Sort (n=5000)      │     3_049.06us │     466_179.00w │      24_582.86w │      24_582.86w │      0.10% │
│ Merge Sort (n=5000)      │     3_111.01us │     717_254.00w │      50_978.12w │      50_978.12w │      0.10% │
│ Tim Sort (n=5000)        │     3_956.88us │     950_008.00w │      61_811.47w │      61_811.47w │      0.13% │
│ Bubble Sort (n=10000)    │ 3_091_844.85us │ 889_800_488.00w │ 172_556_877.30w │ 172_556_877.30w │    100.00% │
│ Insertion Sort (n=10000) │   382_081.01us │  74_920_742.00w │   3_650_101.43w │   3_650_101.43w │     12.36% │
│ Quick Sort (n=10000)     │     5_954.26us │   1_143_715.00w │      96_143.80w │      96_143.80w │      0.19% │
│ Merge Sort (n=10000)     │     5_374.33us │   1_554_452.00w │     156_730.66w │     156_730.66w │      0.17% │
│ Tim Sort (n=10000)       │     6_809.63us │   2_028_358.00w │     194_693.70w │     194_693.70w │      0.22% │
│ Heap Sort (n=100)        │       412.05us │         149.00w │                 │                 │      0.01% │
│ Heap Sort (n=1000)       │       722.90us │         149.00w │                 │                 │      0.02% │
│ Heap Sort (n=5000)       │     2_208.89us │         149.00w │                 │                 │      0.07% │
│ Heap Sort (n=10000)      │     4_206.73us │         149.00w │                 │                 │      0.14% │
└──────────────────────────┴────────────────┴─────────────────┴─────────────────┴─────────────────┴────────────┘
Benchmarks that take 1ns to 100ms can be estimated precisely. For more reliable
estimates, redesign your benchmark to have a shorter execution time.

 Performance counter stats for 'dune exec ./bench/benchmark_sorts.exe':

        255.184,28 msec task-clock                       #    1,000 CPUs utilized
             3.197      context-switches                 #   12,528 /sec
               339      cpu-migrations                   #    1,328 /sec
            19.114      page-faults                      #   74,903 /sec
 1.010.569.182.147      cycles                           #    3,960 GHz
 1.992.068.164.356      instructions                     #    1,97  insn per cycle
   398.770.460.401      branches                         #    1,563 G/sec
     3.947.810.053      branch-misses                    #    0,99% of all branches

     255,265030550 seconds time elapsed

     254,788693000 seconds user
       0,390929000 seconds sys
```

Summary of Results:

| Algorithm       | n=100      | n=1000     | n=5000      | n=10000    |
| --------------- | ---------- | ---------- | ----------- | ---------- |
| **Bubble Sort** | 741.94 µs  | 17.47 ms   | 604.27 ms   | 3.09 s     |
| **Insertion Sort** | 448.54 µs  | 4.40 ms    | 90.04 ms    | 382.08 ms  |
| **Quick Sort**  | 436.16 µs  | 1.43 ms    | 3.05 ms     | 5.95 ms    |
| **Merge Sort**  | 647.09 µs  | 1.37 ms    | 3.11 ms     | 5.37 ms    |
| **Tim Sort**    | 586.01 µs  | 1.63 ms    | 3.95 ms     | 6.81 ms    |
| **Heap Sort**   | 412.05 µs  | 722.90 µs  | 2.21 ms     | 4.21 ms    |


## Key Observations:
1. Best Performance on Small Lists (n = 100):
- Heap Sort, Quick Sort, and Insertion Sort performed best for small inputs.
- Bubble Sort was the slowest for small inputs.
2. Performance on Medium-Size Lists (n = 1000):
- Heap Sort outpeformed other algorithms, with a time of `722.90 µs`.
- Quick Sort and Merge Sort also performed well.
- Bubble Sort continued to show poor performance.
3. Performance on Large Lists (n = 5000):
- Heap Sort provided the best performance, slightly outperforming both Quick
  Sort and Merge Sort.
- Tim Sort was slower than Heap Sort, Quick Sort and Merge Sort, but still
  competive.
- Bubble Sort was very inefficient, taking over 600 ms.
4. Performance on Very Large Lists (n = 10,000):
- Quick Sort and Merge Sort had the best performance.
- Heap Sort also performed well.
- Bubble Sort was extremely inefficient, taking over 3 seconds.

## Real-World Suitablitiy
1. Quick Sort:
- Best for general-purpose sorting and large datasets.
- Highly efficient with an average time complexity of `O(nlogn)`.
- Slightly unstable (does not maintain the order of equal elements), but very fast.
2. Merge Sort:
- Ideal for stable sorting, where the relative order of equal elements matters.
- Great for large datasets, with `O(nlogn)` complexity.
- Uses more memory due to the merging process.
3. Tim Sort:
- Best for real-world, partially sorted data.
- Combines insertion and merge sort techniques, making it efficient on data with
  existing order (e.g., lists that are almost sorted.)
4. Insertion Sort:
- Good for small datasets or nearly sorted data.
- Time complexity of  O(n<sup>2</sup>)
5. Heap Sort:
- Good when memory usage is critical. It uses constant space, making it
  space-efficient.
- Performance is slower than Quick Sort but better suited for scenarios with
  tight memory constraints.
6. Bubble Sort:
- Not recommended for large datasets.
- Very slow as input size increases, making it impractical for most real-world
  applications.

## Conclusion
- Heap Sort performed exceptionally well for medium-sized (n = 1000) and large
  lists (n = 5000) offering the fastest sorting times.
- Quick Sort and Merge Sort remained competive, especially for very large lists
  (n = 10000).
- Tim Sort is still a good option for real-world data, but Heap Sort generally
  performed better on these specific input sizes.
- Bubble Sort is not suitable for large datasets and should be avoided in most
  pratical scenarios.