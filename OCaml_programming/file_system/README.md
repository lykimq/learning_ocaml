# File system

Implement a file system with a hierarchical organization of files and
directories (`lib/file_directory.ml`).

A file system is a way of organizing and storing files on a storage device, such
as hard drive or SSD. The file system provides a structure that allows users and
programs to create, delete, and manage files and directories.


**Key Concepts**
- Files: The basic unit of storage, containing data.
- Directories (Folders): Containers for organizing files and other directories.
  They form a hierarchical structure, similar to a tree.
- Paths: The route through the directory structure to a file or directory, such
  as `/home/user/documents/file.txt`.

## General Tree
- Structure: A general tree allows each node to have an arbitrary number of
  children.
- Use case: Good to representing hierarchial structures like file systems where
  each directory can contain an arbitrary number of files and subdirectories.

## Basic operations:
- Create a new file or directory
- Add a file to a directory
- Remove a file or directory
- Search for a file or directory
- Print the file system

---

## Simple Balanced File System

This document outlines the design and implementation of a simple balanced file
system using a general tree structure (`lib/file_system_simple_balance.ml`). The
purpose of this system is to manage files and directories efficiently, ensuring
that the directory tree remains balanced, which improves performance for
operations such as searching, adding, and removing nodes.

### Purpose

The primary purpose of this file system is to represent a hierarchical structure
where directories can contain files or other directories. By keeping the tree
structure balanced, the system ensures that operations like file addition,
removal, and traversal are efficient, even as the file system grows. The balance
is particularly important to avoid deep nesting of directories, which can lead
to performance degradation.

### Design Choices

#### Tree Structure
The choice of a tree structure is natural for representing a file system, as it
allows for a hierarchical organization of files and directories. Each directory
can contain multiple files and subdirectories, which makes the tree structure an
intuitive and effective choice.

#### Balancing Strategy
To prevent any directory from becoming too large and unwieldy, a simple
balancing strategy is implemented. When the number of children in a directory
exceeds a certain threshold (6 in this case), the directory is split into
smaller subdirectories. This approach is chosen to maintain efficiency in
searching and modifying the file system, as it prevents deep nesting and keeps
operations at a manageable depth.

#### Simplicity and Efficiency
The design focuses on simplicity and efficiency. Instead of implementing complex
balancing algorithms like those found in AVL or B-trees, a straightforward
method is used to split directories when necessary. This makes the
implementation easier to understand and maintain while still achieving the goal
of preventing excessive directory depth.

### Pros
1. Simplicity:

The approach is easy to understand and implement. It avoids the complexity of
more advanced data structures like B-trees or AVL trees, making it suitable for
smaller systems or educational purposes.

2. Basic Balancing:

By splitting directories when they exceed a certain number of children, the
system avoids the problem of very large directories. This helps in preventing
any single directory from becoming a performance bottleneck.

3. Controlled Depth:

The strategy helps in controlling the depth of the directory tree, ensuring that
operations like traversal and searching do not degrade into linear time
operations, which could happen in an unbalanced tree.

### Cons
1. Limited Scalability:

The method uses a fixed threshold (e.g., 6 children per directory) to trigger
rebalancing. This approach might not scale well for larger or more complex file
systems. If the file system grows significantly, the number of splits could
increase rapidly, leading to a fragmented directory structure that may not be
optimal.

2. Lack of Flexibility:

The use of a fixed threshold does not take into account the actual usage
patterns or file sizes. In a real-world scenario, some directories may naturally
need to contain more files without negatively impacting performance, while
others might be fine with fewer.

3. Potential Overhead:

Every time a new file is added, the system checks whether the directory needs
rebalancing. In a large directory with many files, this could introduce
unnecessary overhead, especially if the threshold is frequently exceeded.

4. Not a True Balanced Tree:

The method does not create a truly balanced tree, like an AVL or B-tree would.
Instead, it merely ensures that no directory has more than a certain number of
children. This might lead to suboptimal structures where some parts of the tree
are deeper than necessary.

### When This Approach Makes Sense
Small to Medium-Sized File Systems: For file systems with a relatively small
number of files and directories, where the simplicity of the implementation is
more valuable than the performance characteristics of a more complex structure.

Educational Purposes: This approach is good for learning and understanding basic
concepts of tree balancing without getting into more complex algorithms.

Scenarios with Predictable File Growth: If you know in advance that your file
system will not grow beyond a certain size, this approach could be sufficient.


### Conclusion
The balancing method used in this implementation is functional and might make
sense for certain small-scale applications, especially when simplicity is a
priority. However, for more complex or larger file systems, this approach may
not be the most efficient or scalable. In those cases, a more sophisticated tree
balancing algorithm or structure would likely be necessary to ensure optimal
performance and scalability.
