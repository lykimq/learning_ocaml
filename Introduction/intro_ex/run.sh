#!/bin/bash


# Function to build the project
build() {
    echo "Building the project..."
    dune build
}

# Function to run tests
test(){
    echo "Running test...."
    dune exec ./bin/main.exe
}

# Function to clean the project
clean(){
    echo "Cleaning up build aritfacts...."
    dune clean
}

# Main script logic
case "$1" in
    build)
        build
    ;;
    test)
        test
    ;;
    clean)
        clean
    ;;
    *)
    echo "Usage: $0 {build|test|clean}"
    exit 1
    ;;
esac

