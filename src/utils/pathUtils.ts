/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/pathUtils.ts
 */

/**
 * Prepends a root path to a filename/path if root is defined
 * @param path - The original path/filename
 * @param root - Optional root path to prepend
 * @returns The path with root prepended if root is defined
 */
export function prependRoot(path: string, root: string | undefined): string {
  if (!root || root === "/" || root === "") {
    return path;
  }

  // Ensure root doesn't start with a slash
  const cleanRoot = root.startsWith("/") ? root.slice(1) : root;

  // Ensure path doesn't start with a slash
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Combine with a slash between
  return `${cleanRoot}/${cleanPath}`;
}
