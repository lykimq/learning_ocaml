#!/bin/bash

# Function to build the project
build() {
    echo "Building the project..."
    dune build
}

# Function to run tests
test_ounit() {
    echo "Running OUnit2 tests...."
    dune exec ./test/test_intro_ex_ounit.exe
}


test_alcotest() {
    echo "Running Alcotest tests...."
    dune exec ./test/test_intro_ex_alcotest.exe
}

test_qcheck() {
    echo "Running QCheck tests...."
    dune exec ./test/test_intro_ex_qcheck.exe
}

# Function to clean the project
clean() {
    echo "Cleaning up build artifacts...."
    dune clean
}

# Main script logic
case "$1" in
    build)
        build
        ;;
    test-ounit)
        test_ounit
        ;;
    test-alcotest)
        test_alcotest
        ;;
    test-qcheck)
        test_qcheck
        ;;
    clean)
        clean
        ;;
    *)
        echo "Usage: $0 {build|test-ounit|test-alcotest|test-qcheck|clean}"
        exit 1
        ;;
esac