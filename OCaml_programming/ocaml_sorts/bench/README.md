# Sorting Algorithms Benchmark Report

## Benchmark using `Core_bench`
This report presents the performance of various sorting algorithms tested on
input sizes of 100, 1000, 5000, and 10,000 elements. The tests were run on an
"Intel Core i7-8665U CPU @ 1.90 GHz" with 8 cores, 16GB of memory, and Ubuntu
22.04.5 LTS (64-bit). The benchmarks measured execution time, memory usage, and
other performance metrics to compare the algorithms.

```
perf stat dune exec ./bench/benchmark_sorts.exe
```

### Summary of Results

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


### Key Observations:
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

### Real-World Suitablitiy
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

### Conclusion
- Heap Sort performed exceptionally well for medium-sized (n = 1000) and large
  lists (n = 5000) offering the fastest sorting times.
- Quick Sort and Merge Sort remained competive, especially for very large lists
  (n = 10000).
- Tim Sort is still a good option for real-world data, but Heap Sort generally
  performed better on these specific input sizes.
- Bubble Sort is not suitable for large datasets and should be avoided in most
  pratical scenarios.

---
## Benchmark using `Bechamel` library

### Overview
The Bechamel library was utilized to measure key metrics such as:
- Major Allocation: The amoun of memory allocated for long-term storage (e.g.,
  large data structures).
- Minor Allocation: Memory allocated for short-lived objects.
- Monotonic Clock: The time taken to run each sorting algorithm, in terms of
  wall-clock time.

```
perf stat dune exec ./bench/benchmark_sorts_bechamel.exe
```

In addition, we ran the benchmark using `perf stat` to gather performance counters such as CPU utization, instructions per cycle, and branch misses.

### Summary of results

Full output

```
╭──────────────────────────────────┬───────────────────────────┬───────────────────────────┬───────────────────────────╮
│name                              │  major-allocated          │  minor-allocated          │  monotonic-clock          │
├──────────────────────────────────┼───────────────────────────┼───────────────────────────┼───────────────────────────┤
│  sorts Bubble Sort (n=100)       │47.4318 major-allocated/run│36.5376 minor-allocated/run│59.3520 monotonic-clock/run│
│  sorts Bubble Sort (n=1000)      │81.5361 major-allocated/run│29.2857 minor-allocated/run│16.7182 monotonic-clock/run│
│  sorts Bubble Sort (n=10000)     │48.0000 major-allocated/run│34.0000 minor-allocated/run│80.0000 monotonic-clock/run│
│  sorts Bubble Sort (n=5000)      │59.0000 major-allocated/run│92.4286 minor-allocated/run│38.0000 monotonic-clock/run│
│  sorts Heap Sort (n=100)         │ 0.0000 major-allocated/run│11.3405 minor-allocated/run│95.0235 monotonic-clock/run│
│  sorts Heap Sort (n=1000)        │01.5808 major-allocated/run│10.7692 minor-allocated/run│43.2398 monotonic-clock/run│
│  sorts Heap Sort (n=10000)       │69.7551 major-allocated/run│12.3810 minor-allocated/run│18.0190 monotonic-clock/run│
│  sorts Heap Sort (n=5000)        │88.9671 major-allocated/run│11.6484 minor-allocated/run│56.5904 monotonic-clock/run│
│  sorts Insertion Sort (n=100)    │ 3.8856 major-allocated/run│32.3664 minor-allocated/run│03.5246 monotonic-clock/run│
│  sorts Insertion Sort (n=1000)   │50.3696 major-allocated/run│80.2388 minor-allocated/run│58.3363 monotonic-clock/run│
│  sorts Insertion Sort (n=10000)  │85.2143 major-allocated/run│11.4286 minor-allocated/run│65.7857 monotonic-clock/run│
│  sorts Insertion Sort (n=5000)   │32.8429 major-allocated/run│33.0000 minor-allocated/run│43.8857 monotonic-clock/run│
│  sorts Merge Sort (n=100)        │ 8.5951 major-allocated/run│09.3011 minor-allocated/run│32.7190 monotonic-clock/run│
│  sorts Merge Sort (n=1000)       │35.7615 major-allocated/run│85.6383 minor-allocated/run│58.5735 monotonic-clock/run│
│  sorts Merge Sort (n=10000)      │00.1872 major-allocated/run│35.3077 minor-allocated/run│17.7376 monotonic-clock/run│
│  sorts Merge Sort (n=5000)       │14.3462 major-allocated/run│24.5789 minor-allocated/run│30.9687 monotonic-clock/run│
│  sorts Quick Sort (n=100)        │ 5.0539 major-allocated/run│24.3011 minor-allocated/run│45.2297 monotonic-clock/run│
│  sorts Quick Sort (n=1000)       │64.6263 major-allocated/run│88.6912 minor-allocated/run│75.2072 monotonic-clock/run│
│  sorts Quick Sort (n=10000)      │76.0431 major-allocated/run│20.3810 minor-allocated/run│49.5213 monotonic-clock/run│
│  sorts Quick Sort (n=5000)       │43.1912 major-allocated/run│69.6129 minor-allocated/run│74.7572 monotonic-clock/run│
│  sorts Tim Sort (n=100)          │15.5909 major-allocated/run│95.3525 minor-allocated/run│73.2186 monotonic-clock/run│
│  sorts Tim Sort (n=1000)         │24.1217 major-allocated/run│66.7853 minor-allocated/run│51.0643 monotonic-clock/run│
│  sorts Tim Sort (n=10000)        │55.1558 major-allocated/run│48.7273 minor-allocated/run│82.1784 monotonic-clock/run│
│  sorts Tim Sort (n=5000)         │71.0350 major-allocated/run│56.8519 minor-allocated/run│86.8298 monotonic-clock/run│
╰──────────────────────────────────┴───────────────────────────┴───────────────────────────┴───────────────────────────╯

 Performance counter stats for 'dune exec ./bench/benchmark_sorts_bechamel.exe':

         52.014,43 msec task-clock                       #    0,997 CPUs utilized
             2.532      context-switches                 #   48,679 /sec
                71      cpu-migrations                   #    1,365 /sec
            10.192      page-faults                      #  195,946 /sec
   213.410.416.324      cycles                           #    4,103 GHz
   556.799.282.097      instructions                     #    2,61  insn per cycle
   105.250.193.443      branches                         #    2,023 G/sec
     1.159.409.479      branch-misses                    #    1,10% of all branches

      52,193802441 seconds time elapsed

      51,970314000 seconds user
       0,041394000 seconds sys
```

**Major Allocation per Run (Sorted by Algorithm and Input Size)**
| Algorithm         | n=100  | n=1000  | n=5000  | n=10000  |
|-------------------|--------|---------|---------|----------|
| **Bubble Sort**    | 43.94  | 43.03   | 19.29   | 79.00    |
| **Heap Sort**      | 0.00   | 1.66    | 88.97   | 69.76    |
| **Insertion Sort** | 2.40   | 62.83   | 80.39   | 84.43    |
| **Merge Sort**     | 10.13  | 7.07    | 51.65   | 67.55    |
| **Quick Sort**     | 1.76   | 83.18   | 0.26    | 50.68    |
| **Tim Sort**       | 14.67  | 91.34   | 18.50   | 7.72     |

- Heap Sort stans out as the most memory-efficient algorithm in terms of major
  allocations. It had no major allocations for small input (n = 100).
- Insertion Sort shows an increase in major allocations as input size grows.
  This suggests that Insertion Sort becomes inefficient for larger datasets when
  it comes to long-term memory allocation.
- Merge Sort maintains relatively stable memory allocation across different
  input sizes. However, it experiences a spike in major allocations at n =
  10000, indicating that it may use more memory when dealing with very large
  datasets.
- Quick Sort's memory usage is not consistently increasing with input sizes,
  andit seems to be affected by specific data characteristics and implementation
  details rather than the pivot selection alone.
- Tim Sort's major allocations decrease with larger input sizes after peaking at
  n=1000. This could be due to how Tim Sort identifies and merges runs in
  partially sorted data.


**Minor Allocations per Run (Sorted by Algorithm and Input Size)**

| Algorithm         | n=100  | n=1000  | n=5000  | n=10000  |
|-------------------|--------|---------|---------|----------|
| **Bubble Sort**    | 42.54  | 67.55   | 37.43   | 2.00     |
| **Heap Sort**      | 11.35  | 10.75   | 11.65   | 12.38    |
| **Insertion Sort** | 12.39  | 96.17   | 52.00   | 96.43    |
| **Merge Sort**     | 29.32  | 35.63   | 66.61   | 79.46    |
| **Quick Sort**     | 40.33  | 64.68   | 93.65   | 14.73    |
| **Tim Sort**       | 65.37  | 28.81   | 50.85   | 61.83    |


**Memory Allocation Results**
- Bubble Sort: Exhibited relatively high minor allocations across all input sizes, indicating a higher short-term memory usage.
- Heap Sort: Showed very low memory allcations, making it one of the most memory-efficient sorting algorithms in the test.
- Insertion Sort: Allocated more memory as the input size increased, showing more significant major allocations for larger datasets.
- Merge Sort: Demonstrated efficient memory usage, with low major allocations across different input sizes.
- Quick Sort: Exhibited relatively high minor allocations, especially for larger input sizes.
- Tim Sort: Had higher memory usage than Quick Sort and Merge Sort, particularly for large input sizes (n = 5000 and n = 10000).


**Monotonic Clock Time per Run**

| Algorithm       | n=100                      | n=1000                     | n=5000                     | n=10000                    |
| --------------- | -------------------------- | ---------------------------| ---------------------------| ---------------------------|
| **Bubble Sort** | 59.35 monotonic-clock/run   | 16.72 monotonic-clock/run   | 38.00 monotonic-clock/run   | 80.00 monotonic-clock/run   |
| **Heap Sort**   | 95.02 monotonic-clock/run   | 43.23 monotonic-clock/run   | 56.59 monotonic-clock/run   | 18.01 monotonic-clock/run   |
| **Insertion Sort** | 3.52 monotonic-clock/run  | 58.33 monotonic-clock/run   | 43.88 monotonic-clock/run   | 65.78 monotonic-clock/run   |
| **Merge Sort**  | 32.71 monotonic-clock/run   | 58.57 monotonic-clock/run   | 30.96 monotonic-clock/run   | 17.73 monotonic-clock/run   |
| **Quick Sort**  | 45.22 monotonic-clock/run   | 75.20 monotonic-clock/run   | 74.75 monotonic-clock/run   | 49.52 monotonic-clock/run   |
| **Tim Sort**    | 73.21 monotonic-clock/run   | 51.06 monotonic-clock/run   | 86.82 monotonic-clock/run   | 82.17 monotonic-clock/run   |

