# Mushclient Definition Generator

## What is it?

It is a file you can place into your Mushclient installation that will allow VS Code to recognize Mushclient API globals. In addition, it enables completion and some basic documentation support.

## How do I use it?

The only file you need to download is `mushclient_definitions.lua` from this repo. Place it within the Lua folder in your Mushclient installation directory or wherever else you put your lua files.

This is only tested with Sumneko's [Lua Language Server](https://github.com/LuaLS/lua-language-server) extension for VS Code. You will need to configure the language server for it to recognize libraries. View the language server's wiki for detailed instructions. Personally, I have the following configuration:

`.vscode/settings.json`

```json
{
  "Lua.runtime.version": "Lua 5.1",
  "Lua.workspace.library": [
    "${workspace}/lua",
    "${workspace}/worlds/plugins/lua"
  ]
}
```

I have placed `mushclient_definitions.lua` into Mushclient's toplevel Lua directory but you should add the directory where you put yours into that list.

You do Not and Should not `require` the definitions file. The language server will automatically pick it up as long as it is in your library include path.
