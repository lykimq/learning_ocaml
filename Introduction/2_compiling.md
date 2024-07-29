# Chapter 2: Compiling OCaml programms

In this section, we only mention about Dune. Dune is a build system for managing and compiling OCaml projects, making it easier to handle larger codebases. Here's a simple guide to using Dune:

## What is Dune?
- **Purpose**: Dune automates the build process for OCaml projects, handling compilation and managing dependencies. It is like having a helper that organizes and compiles your code without you having to do it manually.
- **Comparison**: Similar to tools like make for C, and Gradle or Maven for Java.

## Setting up a Dune project
1. Manually Setup:

- Create a project:
    - In your project directory, make a file named `dune` with this content:

    ```lisp
    (excutable
      (name hello))
    ```
    This defines a program (`hello.ml`) that can be run.

    - Make a file named `dune-project` with:

    ```lisp
    (lang dune 3.4)
    ```
    This tells Dune to use version 3.4

- Build the project:
    - Run the command:

    ```bash
    dune build hello.exe
    ```
    Dune compiles your code and places the compiles files in a separate `_build` directory.

- Run the program:
    - To run your program, use:

    ```bash
    dune exec ./hello.exe
    ```
    This runs the compiled executable.

- Clean up:
    - To remove compiled files, run:

    ```bash
    dune clean
    ```
    This deletes the `_build` directory, keeping your source code clean.

2. Automatic project creation:
- Create a new project:
    - In your terminal, navigate to your desired directory and run:

    ```bash
    dune init project calculator
    ```
    This creates a new project named `calculator`.

- Open and run:
    - Navigate into the project folder and open it in VS Code:

    ```bash
    cd calculator
    code.
    ```

    - Run the example program with:

    ```bash
    dune exec bin/main.exe
    ```
    It should display "Hello, World!"

3. Continuous building:
- Automatic compilation:
    - To have Dune automatically recompile your project whenever you save changes, use:

    ```bash
    dune build --watch
    ```
    Dune will keep running and update the build whenever you make changes to your code. Press `Control+C` to stop this.

## Tips and warnings:
- Source code recovery: Dune caches your source files in `_build/default`. If you lose a source file, you might recover it from this cache, though using version control like git is better.
- Editing files: avoiding editing files in `_build` directory. They are generated and should not be manually modified.

In essence, Dune simplifies managing and building OCaml projects, automates repetitive tasks, and helps keep your code organized and up-to-date.