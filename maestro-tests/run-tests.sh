#!/bin/bash

# AI Companion - Maestro Test Runner
# This script runs Maestro E2E tests with different configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERBOSE=false
DEVICE_ID=""
FORMAT=""
TEST_DIR=""
REPORT_DIR="./test-reports"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [TEST_DIR]"
    echo ""
    echo "Options:"
    echo "  -v, --verbose     Enable verbose output"
    echo "  -d, --device-id   Specify device ID"
    echo "  -f, --format      Output format (junit, json)"
    echo "  -r, --report-dir  Report directory (default: ./test-reports)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests"
    echo "  $0 auth/                             # Run auth tests only"
    echo "  $0 -v auth/login.yaml                # Run specific test with verbose output"
    echo "  $0 -d emulator-5554 auth/            # Run auth tests on specific device"
    echo "  $0 -f junit -r reports/              # Run tests and generate JUnit report"
}

# Function to check if Maestro is installed
check_maestro() {
    if ! command -v maestro &> /dev/null; then
        print_error "Maestro is not installed. Please install it first:"
        echo "curl -Ls \"https://get.maestro.mobile.dev\" | bash"
        exit 1
    fi
    print_success "Maestro is installed"
}

# Function to check if app is installed
check_app() {
    if [ -n "$DEVICE_ID" ]; then
        if ! adb -s "$DEVICE_ID" shell pm list packages | grep -q "com.healthlog.mobile"; then
            print_error "App is not installed on device $DEVICE_ID"
            exit 1
        fi
    else
        if ! adb shell pm list packages | grep -q "com.healthlog.mobile"; then
            print_error "App is not installed on any device"
            exit 1
        fi
    fi
    print_success "App is installed"
}

# Function to create report directory
create_report_dir() {
    if [ ! -d "$REPORT_DIR" ]; then
        mkdir -p "$REPORT_DIR"
        print_status "Created report directory: $REPORT_DIR"
    fi
}

# Function to run tests
run_tests() {
    local test_path="$1"
    local cmd="maestro test"
    
    if [ "$VERBOSE" = true ]; then
        cmd="$cmd --verbose"
    fi
    
    if [ -n "$DEVICE_ID" ]; then
        cmd="$cmd --device-id $DEVICE_ID"
    fi
    
    if [ -n "$FORMAT" ]; then
        cmd="$cmd --format $FORMAT"
        if [ "$FORMAT" = "junit" ]; then
            cmd="$cmd --output $REPORT_DIR/junit-report.xml"
        elif [ "$FORMAT" = "json" ]; then
            cmd="$cmd --output $REPORT_DIR/json-report.json"
        fi
    fi
    
    cmd="$cmd $test_path"
    
    print_status "Running command: $cmd"
    eval "$cmd"
}

# Function to run all tests
run_all_tests() {
    print_status "Running all tests..."
    run_tests "."
}

# Function to run tests in directory
run_directory_tests() {
    local dir="$1"
    print_status "Running tests in directory: $dir"
    run_tests "$dir"
}

# Function to run specific test
run_specific_test() {
    local test_file="$1"
    print_status "Running specific test: $test_file"
    run_tests "$test_file"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--device-id)
            DEVICE_ID="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -r|--report-dir)
            REPORT_DIR="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            TEST_DIR="$1"
            shift
            ;;
    esac
done

# Main execution
main() {
    print_status "Starting Maestro E2E tests for AI Companion"
    
    # Check prerequisites
    check_maestro
    check_app
    
    # Create report directory if needed
    create_report_dir
    
    # Run tests based on input
    if [ -z "$TEST_DIR" ]; then
        run_all_tests
    elif [ -d "$TEST_DIR" ]; then
        run_directory_tests "$TEST_DIR"
    elif [ -f "$TEST_DIR" ]; then
        run_specific_test "$TEST_DIR"
    else
        print_error "Test path not found: $TEST_DIR"
        exit 1
    fi
    
    print_success "Tests completed!"
    
    if [ -n "$FORMAT" ]; then
        print_status "Reports saved to: $REPORT_DIR"
    fi
}

# Run main function
main
