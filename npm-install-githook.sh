#/usr/bin/env bashchanged_files="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"check_run() {
    if echo "$changed_files" | grep -q "$1"; then
        echo "Found diff in $1"
        eval "$2"
    else
        echo "Not found any diff in $1"
    fi
}check_run package.json "npm install && npm prune"