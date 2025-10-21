#!/bin/bash

# Script to manage version bumping for JournAI backend and frontend
# Usage: ./scripts/version-manager.sh [backend|frontend] [get|set] [version]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VALUES_FILE="$PROJECT_ROOT/JournAI-Chart/values.yaml"

usage() {
    echo "Usage: $0 [backend|frontend] [get|set|increment] [version]"
    echo "Examples:"
    echo "  $0 backend get        # Get current backend version"
    echo "  $0 backend increment  # Increment backend version"
    echo "  $0 backend set 1.5    # Set backend version to 1.5"
    exit 1
}

# Check arguments
if [ $# -lt 2 ]; then
    usage
fi

SERVICE=$1
ACTION=$2
VERSION=$3

# Validate service
if [[ "$SERVICE" != "backend" && "$SERVICE" != "frontend" ]]; then
    echo "Error: Service must be 'backend' or 'frontend'"
    usage
fi

# Validate action
if [[ "$ACTION" != "get" && "$ACTION" != "set" && "$ACTION" != "increment" ]]; then
    echo "Error: Action must be 'get', 'set', or 'increment'"
    usage
fi

get_current_version() {
    local service=$1
    local current_version

    if [[ "$service" == "backend" ]]; then
        current_version=$(grep -A 2 -B 2 "journai-backend" "$VALUES_FILE" | grep 'tag: "v' | head -1 | sed 's/.*tag: "\([^"]*\)".*/\1/' | sed 's/v//')
    else
        current_version=$(grep -A 2 -B 2 "journai-frontend" "$VALUES_FILE" | grep 'tag: "v' | head -1 | sed 's/.*tag: "\([^"]*\)".*/\1/' | sed 's/v//')
    fi

    if [[ -z "$current_version" ]]; then
        echo "Error: Could not find current version for $service"
        exit 1
    fi

    echo "$current_version"
}

increment_version() {
    local current_version=$1
    local new_version

    new_version=$(echo "$current_version" | awk -F. '{print $1"."($2+1)}')

    echo "$new_version"
}

update_values_file() {
    local service=$1
    local new_version=$2

    # Create a backup
    cp "$VALUES_FILE" "$VALUES_FILE.backup"
    
    if [[ "$service" == "backend" ]]; then
        # For backend - use sed to update the version
        sed -i "/^backend:/,/^[^[:space:]#]/ {
            s/\(tag:[[:space:]]*\"\?v\?\)[0-9.]\+\(\"\?\s*$\)/\1${new_version}\2/
        }" "$VALUES_FILE"
    else
        # For frontend - use sed to update the version
        sed -i "/^frontend:/,/^[^[:space:]#]/ {
            s/\(tag:[[:space:]]*\"\?v\?\)[0-9.]\+\(\"\?\s*$\)/\1${new_version}\2/
        }" "$VALUES_FILE"
    fi

    echo "Updated $service version to v$new_version"
}

case $ACTION in
    "get")
        get_current_version "$SERVICE"
        ;;
    "increment")
        current_version=$(get_current_version "$SERVICE")
        new_version=$(increment_version "$current_version")
        update_values_file "$SERVICE" "$new_version"
        echo "$new_version"
        ;;
    "set")
        if [[ -z "$VERSION" ]]; then
            echo "Error: Version must be specified for 'set' action"
            usage
        fi
        update_values_file "$SERVICE" "$VERSION"
        ;;
    *)
        usage
        ;;
esac
