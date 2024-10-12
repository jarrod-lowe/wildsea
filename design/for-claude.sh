#!/bin/bash -eu

# Read input line by line
while IFS= read -r line; do
  # Check if the line contains a placeholder like ===path/to/file
  if [[ "$line" =~ ^===([^[:space:]]+)$ ]]; then
    file_path="${BASH_REMATCH[1]}"

    # Check if the file exists
    if [ -f "$file_path" ]; then
      # Output the content of the file
      cat "$file_path"
    else
      echo "Warning: File $file_path not found, skipping." >&2
      exit 1
    fi
  else
    # Output the line as-is if no placeholder is found
    echo "$line"
  fi
done
