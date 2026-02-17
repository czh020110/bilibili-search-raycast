/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `login` command */
  export type Login = ExtensionPreferences & {}
  /** Preferences accessible in the `history` command */
  export type History = ExtensionPreferences & {}
  /** Preferences accessible in the `favorites` command */
  export type Favorites = ExtensionPreferences & {}
  /** Preferences accessible in the `bilibili-search` command */
  export type BilibiliSearch = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `login` command */
  export type Login = {}
  /** Arguments passed to the `history` command */
  export type History = {}
  /** Arguments passed to the `favorites` command */
  export type Favorites = {}
  /** Arguments passed to the `bilibili-search` command */
  export type BilibiliSearch = {
  /** Search... */
  "query": string
}
}

