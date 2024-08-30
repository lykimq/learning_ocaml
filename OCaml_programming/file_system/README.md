# File system

Implement a file system with a hierarchical organization of files and directories.

A file system is a way of organizing and storing files on a storage device, such as hard drive or SSD. The file system provides a structure that allows users and programs to create, delete, and manage files and directories.


**Key Concepts**
- Files: The basic unit of storage, containing data.
- Directories (Folders): Containers for organizing files and other directories. They form a hierarchical structure, similar to a tree.
- Paths: The route through the directory structure to a file or directory, such as `/home/user/documents/file.txt`.

## General Tree
- Structure: A general tree allows each node to have an arbitrary number of children.
- Use case: Good to representing hierarchial structures like file systems where each directory can contain an arbitrary number of files and subdirectories.

## Basic operations:
- Create a new file or directory
- Add a file to a directory
- Remove a file or directory
- Search for a file or directory
- Print the file system