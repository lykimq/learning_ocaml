# Summary Report of Benchmark Results

The benchmarks were performed on various search algorithms (Linear Search,
Binary Search, Jump Search, Exponential Search and Fibonacci Search) accross
three list size: small (1000 elements), medium (5000 elements), large (10000
elements). The performance of each search algorithm is measured by throughput
which indicates the number of searches completed per second. Additionally,
relative performance comparisons between algorithms are provided.


## Results Breakdown by List Size:

```
perf stat dune exe ./bench/bench_searchs.exe
```


```
Performance counter stats for 'dune exe ./bench/bench_searchs.exe':

         56.133,99 msec task-clock                       #    1,000 CPUs utilized
               283      context-switches                 #    5,042 /sec
                45      cpu-migrations                   #    0,802 /sec
             5.419      page-faults                      #   96,537 /sec
   232.205.460.117      cycles                           #    4,137 GHz
   516.739.530.436      instructions                     #    2,23  insn per cycle
   174.136.716.151      branches                         #    3,102 G/sec
        71.350.586      branch-misses                    #    0,04% of all branches

      56,139283787 seconds time elapsed

      56,109220000 seconds user
       0,025151000 seconds sys
```

### Small List (1000 elements)

```
Throughputs for "Linear search (small)", "Binary search (small)", "Jump search (small)", "Exponential search (small)" each running for at least 3 CPU seconds:
     Linear search (small):  3.23 WALL ( 3.23 usr +  0.00 sys =  3.23 CPU) @ 271481.52/s (n=877570)
     Binary search (small):  3.07 WALL ( 3.07 usr +  0.00 sys =  3.07 CPU) @ 167192.39/s (n=513287)
       Jump search (small):  3.14 WALL ( 3.14 usr +  0.00 sys =  3.14 CPU) @ 74995.31/s (n=235511)
Exponential search (small):  3.14 WALL ( 3.14 usr +  0.00 sys =  3.14 CPU) @ 214190.59/s (n=671969)
                     Rate Jump search (small) Binary search (small) Exponential search (small) Linear search (small)
       Jump search (small)  74995/s                  --                  -55%                       -65%                  -72%
     Binary search (small) 167192/s                123%                    --                       -22%                  -38%
Exponential search (small) 214191/s                186%                   28%                         --                  -21%
     Linear search (small) 271482/s                262%                   62%                        27%                    --
```

| Algorithm                | Throughput (operations/sec) | Relative Performance Compared to Slowest |
|--------------------------|-----------------------------|------------------------------------------|
| **Linear Search (small)**    | 271,482 ops/sec             | +262% faster than Jump Search            |
| **Exponential Search (small)** | 214,191 ops/sec             | +186% faster than Jump Search            |
| **Binary Search (small)**    | 167,192 ops/sec             | +123% faster than Jump Search            |
| **Jump Search (small)**      | 74,995 ops/sec              | Slowest                                  |

- Fastest: Linear Search performs the best with 271,482 ops/sec, 72% faster than
  Jump Search.
- Slowest: Jump Search is the slowest, performing 74,995 ops/sec.

### Medium List (5000 elmenents)

```
Throughputs for "Fibonacci search (medium)", "Linear search (medium)", "Binary search (medium)", "Jump search (medium)", "Exponential search (medium)", "Fibonacci search (medium)" each running for at least 3 CPU seconds:
  Fibonacci search (medium):  3.11 WALL ( 3.11 usr +  0.00 sys =  3.11 CPU) @ 68875.46/s (n=214337)
     Linear search (medium):  3.17 WALL ( 3.17 usr +  0.00 sys =  3.17 CPU) @ 50674.51/s (n=160822)
     Binary search (medium):  3.15 WALL ( 3.15 usr +  0.00 sys =  3.15 CPU) @ 27676.01/s (n=87131)
       Jump search (medium):  3.14 WALL ( 3.14 usr +  0.00 sys =  3.14 CPU) @ 7564.87/s (n=23720)
Exponential search (medium):  3.10 WALL ( 3.10 usr +  0.00 sys =  3.10 CPU) @ 28209.24/s (n=87402)
  Fibonacci search (medium):  3.16 WALL ( 3.16 usr +  0.00 sys =  3.16 CPU) @ 69293.56/s (n=218898)
                       Rate Jump search (medium) Binary search (medium) Exponential search (medium) Linear search (medium) Fibonacci search (medium) Fibonacci search (medium)
       Jump search (medium)  7565/s                   --                   -73%                        -73%                   -85%                      -89%                      -89%
     Binary search (medium) 27676/s                 266%                     --                         -2%                   -45%                      -60%                      -60%
Exponential search (medium) 28209/s                 273%                     2%                          --                   -44%                      -59%                      -59%
     Linear search (medium) 50675/s                 570%                    83%                         80%                     --                      -26%                      -27%
  Fibonacci search (medium) 68875/s                 810%                   149%                        144%                    36%                        --                       -1%
  Fibonacci search (medium) 69294/s                 816%                   150%                        146%                    37%                        1%                        --
```
| Algorithm                | Throughput (operations/sec) | Relative Performance Compared to Slowest |
|--------------------------|-----------------------------|------------------------------------------|
| **Fibonacci Search (medium)** | 69,294 ops/sec              | +816% faster than Jump Search            |
| **Linear Search (medium)**    | 50,675 ops/sec              | +570% faster than Jump Search            |
| **Exponential Search (medium)** | 28,209 ops/sec              | +273% faster than Jump Search            |
| **Binary Search (medium)**    | 27,676 ops/sec              | +266% faster than Jump Search            |
| **Jump Search (medium)**      | 7,565 ops/sec               | Slowest                                  |

- Fastest: Fibonacci Search is the best performer for the medium list size with
  69,294 ops/sec.
- Slowest: Jump Search perfoms the worst, with only 7,565 ops/sec.

### Large List (10000 elements)

```
Throughputs for "Linear search (large)", "Binary search (large)", "Jump search (large)", "Exponential search (large)", "Fibonacci search (large)" each running for at least 3 CPU seconds:
     Linear search (large):  3.14 WALL ( 3.14 usr +  0.00 sys =  3.14 CPU) @ 25428.07/s (n=79810)
     Binary search (large):  3.10 WALL ( 3.10 usr +  0.00 sys =  3.10 CPU) @ 11739.83/s (n=36350)
       Jump search (large):  3.14 WALL ( 3.14 usr +  0.00 sys =  3.14 CPU) @ 3103.25/s (n=9747)
Exponential search (large):  3.21 WALL ( 3.21 usr +  0.00 sys =  3.21 CPU) @ 12302.85/s (n=39435)
  Fibonacci search (large):  3.11 WALL ( 3.11 usr +  0.00 sys =  3.11 CPU) @ 9372.01/s (n=29152)
                      Rate Jump search (large) Fibonacci search (large) Binary search (large) Exponential search (large) Linear search (large)
       Jump search (large)  3103/s                  --                     -67%                  -74%                       -75%                  -88%
  Fibonacci search (large)  9372/s                202%                       --                  -20%                       -24%                  -63%
     Binary search (large) 11740/s                278%                      25%                    --                        -5%                  -54%
Exponential search (large) 12303/s                296%                      31%                    5%                         --                  -52%
     Linear search (large) 25428/s                719%                     171%                  117%                       107%                    --
```

| Algorithm                | Throughput (operations/sec) | Relative Performance Compared to Slowest |
|--------------------------|-----------------------------|------------------------------------------|
| **Linear Search (large)**     | 25,428 ops/sec              | +719% faster than Jump Search            |
| **Exponential Search (large)** | 12,303 ops/sec              | +296% faster than Jump Search            |
| **Binary Search (large)**     | 11,740 ops/sec              | +278% faster than Jump Search            |
| **Fibonacci Search (large)**  | 9,372 ops/sec               | +202% faster than Jump Search            |
| **Jump Search (large)**       | 3,103 ops/sec               | Slowest                                  |

- Fastest: Linear Search outperforms others for the large list size, achieving
  25,428 ops/sec.
- Slowest: Jump Search is again the slowest, performing only 3,103 ops/sec.

## Overall Observations:
1. Linear Search:
- Suprisingly, Linear Search performed the best in both small and large lists.
- Best for: Small to medium-sized lists or unsorted data. It provides consistent
  performance but may not scale well for very large datasets.

2. Exponential Search:
- It showed a solid performance across all list sizes. It combines binary search
  after finding the range, which explains why it is faster than other search
  algorithms in some cases.
- Best for: Large, sorted datasets where the values are distrubuted over a wide
  range. It efficiently narrows down the search range before switching to binary
  search.

3. Binary Search:
- Binary Search showed good performance, especially in large datasets. It is not
  the fastest in small lists but remains competitive in medium and large
  datasets.
- Best for: Large, sorted datasets. This algorithm works well when data is
  sorted, providing a logrithmic time complexity.

4. Fibonacci Search:
- It performed well for the medium list size but lagged behind in large
  datasets. It offers a more theoretical advantage in certain scenarios, but
  other seaches, like Binary Search, are generally more efficient in practice.
- Best for: Niche cases where Fibonacci-based division of the dataset gives an
  advantage over binary search. It works well on sorted data but is not widely
  used in practice.

5. Jump Search:
- Jump search consistently showed the worst performance accross all list sizes.
  The overhead of jumping and then performing linear search limits its
  scalability.
- Best for: small datasets or lists where random access times are very
  expensive. However, it is generally outperformed by other algorithms in most
  cases.

## Conclusion
- For small datasets: Linear Search is simple and performs the best, making it
  ideal when datasets are small and unsorted. It has low overhead compared to
  other more complex algorithms.
- For medium datasets: Fibonacci Search performs well but Linear and Exponential
  Searches are also competitive. Exponential Search may be preferred for sorted
  data due to its balanced approach of narrowing down the range.
- For large datasets: Binary Search and Exponential Search are the most
  effective choices when the data is sorted. Both offer logarithmic time
  complexity, making them efficient for large inputs. Linear Search, while
  performing well, is not recommended for large datasets as its performance will
  degrade with list size.
- Jump Search generally performed poorly and is not recommended unless there are
  specific conditions where its properties (skipping ahead by a fixed step)
  offer a tangible benefit, which is rare.

## Real-World Problem Recommendations:
- Linear Search is suitable for unsorted, small datasets or datasets where
  simplicity is preferred over performance, such as simple search
  functionalities in UI components.
- Binary Search is ideal for sorted datasets where frequent lookups are needed, such as in search for an entry in a sorted database or index.
- Exponential Search excels in large sorted datasets where the value are not
  uniformly distributed, making it useful in hierarchical databases or file
  systems.
- Fibonacci Search is more theoretical and less used in practice but might
  provide benefits in systems where comparison are costly.
- Jump Search is not recommended but may be useful in environments with high
  random access costs, such as certain types of memory systems.
