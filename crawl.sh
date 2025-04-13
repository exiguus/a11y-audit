#!/bin/bash
# Description:
#   This script crawls a website, extracts URLs, and saves them to a sitemap file.
#
# Details:
# - It uses wget to recursively get all page URLs from the base URL.
# - Filters URLs that end with .html using --accept-regex.
# - Ignores URLs that contain _Druckvorschau.html using --reject-regex.
# - Extracts URLs from the wget output using sed.
# - Saves the URLs to a file named sitemap.txt.
# - Cleans up temporary files created during the process.
#
# Usage:
#   ./crawl.sh https://www.example.org/

set -o errexit
set -o nounset
set -o pipefail

# Constants
readonly SITEMAP_FILE="sitemap.txt"
readonly TEMP_FILE=".tmp_crawl"
readonly TEMP_PATH=$(mktemp -d)
readonly USER_AGENT="Mozilla/5.0 (compatible; a11y:audit/SCAN; de-DE; v.0.1)"

# Functions
print_usage() {
  echo "Usage: $0 <base_url>"
}

pre_cleanup() {
  if [[ -f "${SITEMAP_FILE}" ]]; then
    rm -f "${SITEMAP_FILE}"
  fi
}

post_cleanup() {
  if [[ -f "${TEMP_FILE}" ]]; then
    rm -f "${TEMP_FILE}"
  fi
  if [[ -d "${TEMP_PATH}" ]]; then
    rm -rf "${TEMP_PATH}"
  fi
}

pre_task() {
  # Pre-cleanup: remove existing sitemap file
  pre_cleanup
}

post_task() {
  # Extract URLs from the TEMP_FILE and save to sitemap.txt
  grep -oP '(?<=URL:).*?(?=\s)' "${TEMP_FILE}" > "${SITEMAP_FILE}"

  # Check if the sitemap file was created successfully
  if [[ -f "${SITEMAP_FILE}" ]]; then
    echo "Sitemap file created successfully: ${SITEMAP_FILE}"
  else
    echo "Error: Failed to create sitemap file."
  fi

  wait 1
  # Post-cleanup: remove temporary files
  post_cleanup
}

# Main script
main() {
  if [[ $# -ne 1 ]]; then
    print_usage
    exit 1
  fi

  # Check if the base URL is valid
  if ! [[ "$1" =~ ^https?:// ]]; then
    echo "Error: Invalid URL format. Please provide a valid base URL."
    print_usage
    exit 1
  fi

    # Pre-cleanup: remove existing sitemap file
  pre_task

  # Set the base URL from the command line argument
  local base_url="$1"

  # Use wget to recursively download pages and save URLs
  wget --wait=1 \
       --spider \
       --recursive \
       --no-verbose \
       --span-hosts \
       --no-clobber \
       --no-parent \
       -e robots=off \
       --no-check-certificate \
       --keep-session-cookies \
       --continue \
       --accept-regex="${base_url}.*\.html" \
       --reject-regex="_Druckvorschau\.html$" \
       -U "${USER_AGENT}" \
       --header="Accept-encoding: identity" \
       --output-file="${TEMP_FILE}" \
       --directory-prefix="${TEMP_PATH}" \
       "${base_url}"
}

# Trap cleanup function to ensure temporary files are removed
trap 'post_cleanup' EXIT

main "$@"
