#!/usr/bin/env node

import chalk from "chalk";
import eventToPromise from "event-to-promise";
import execPromise from "exec-promise";
import minimist from "minimist";
import { create as createHttpServer } from "http-server-plus";
import { inspect } from "util";
import { load as loadConfig } from "app-conf";
import { readFile } from "fs-promise";

import { name as pkgName, version as pkgVersion } from "../package.json";

import { createReadableCopies, proxyHttpsRequest, splitHost } from "./utils";
import { isXmlRpcRequest, parseRequest } from "./xml-rpc";

// ===================================================================

const paintArg = chalk.yellow;

const requiredArg = name => {
  const message = `Missing argument: <${paintArg(name)}>`;

  throw message;
};

const invalidArg = (name, value) => {
  const message = `Invalid value ${chalk.bold(value)} for argument: <${paintArg(
    name
  )}>`;

  throw message;
};

// ===================================================================

const wrapAsync = asyncFn =>
  async function() {
    try {
      return await asyncFn.apply(this, arguments);
    } catch (error) {
      console.error(error.stack || error);

      throw error;
    }
  };

// -------------------------------------------------------------------

const COMMANDS = {
  async proxy(args) {
    let {
      bind = "0",
      _: [remote = requiredArg("remote address")],
    } = minimist(args, {
      string: "bind",
    });

    bind = {
      cert: await readFile(`${__dirname}/../cert.pem`),
      key: await readFile(`${__dirname}/../key.pem`),
      ...splitHost(bind),
    };
    remote = {
      protocol: "https:",
      ...splitHost(remote),
    };

    // ---------------------------------

    const handleRequest = async (req, res) => {
      console.log("[%s] - Not XML-RPC", chalk.blue(req.url));

      await proxyHttpsRequest(remote, req).pipe(res);
    };

    const handleXmlRpcRequest = async (req, res) => {
      const [req1, req2] = createReadableCopies(2, req);
      const [res1] = createReadableCopies(
        1,
        await proxyHttpsRequest(
          {
            ...req,
            ...remote,
          },
          req1
        )
      );
      res1.pipe(res);

      const { method, params } = await parseRequest(req2);
      console.log(
        "[%s] %s(%s)",
        chalk.blue(req.url),
        chalk.bold.red(method),
        inspect(params, {
          colors: true,
          depth: null,
        })
      );
    };

    // ---------------------------------

    const server = createHttpServer(
      wrapAsync((req, res) =>
        isXmlRpcRequest(req)
          ? handleXmlRpcRequest(req, res)
          : handleRequest(req, res)
      )
    );

    console.log(await server.listen(bind));

    await eventToPromise(server, "close");
  },
};

// ===================================================================

const usage = `Usage: ${pkgName} proxy [--bind <local address>] <remote address>

  Create a XML-RPC proxy which forward requests from <local address>
  to <remote address>.

  <local address>:  [<hostname>]:<port>
  <remote address>: <hostname>[:<port = 443>]

${pkgName} v${pkgVersion}
`.replace(/<([^>]+)>/g, (_, arg) => `<${paintArg(arg)}>`);

execPromise(async args => {
  const { help = false, _: restArgs, "--": restRestArgs } = minimist(args, {
    boolean: "help",
    alias: {
      help: "h",
    },
    stopEarly: true,
    "--": true,
  });

  if (help) {
    return usage;
  }

  // Work around https://github.com/substack/minimist/issues/71
  restArgs.push("--");
  [].push.apply(restArgs, restRestArgs);

  const [commandName, ...commandArgs] = restArgs;

  if (commandName === "--") {
    throw usage;
  }

  const command = COMMANDS[commandName];
  if (!command) {
    invalidArg("command", commandName);
  }

  return command.call(
    {
      config: await loadConfig("xapi-inspector"),
    },
    commandArgs
  );
});
