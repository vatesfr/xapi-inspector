# xapi-inspector [![Build Status](https://travis-ci.org/vatesfr/xapi-inspector.png?branch=master)](https://travis-ci.org/vatesfr/xapi-inspector)

> ${pkg.description}

## Install

Installation of the [npm package](https://npmjs.org/package/xapi-inspector):

```
> npm install --global xapi-inspector
```

Or:

```
> yarn global add xapi-inspector
```

## Usage

```
Usage: xapi-inspector proxy [--bind <local address>] <remote address>

  Create a XML-RPC proxy which forward requests from <local address>
  to <remote address>.

  <local address>:  [<hostname>]:<port>
  <remote address>: <hostname>[:<port = 443>]
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are _very_ welcomed, either on the documentation or on
the code.

You may:

- report any [issue](${pkg.bugs})
  you've encountered;
- fork and create a pull request.

## License

${pkg.license} © [${pkg.author.name}](${pkg.author.url})
