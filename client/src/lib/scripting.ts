import { MudTrigger, MudAlias } from "@shared/schema";

// Global variables storage for scripts
const scriptVariables: Record<string, unknown> = {};

// Scripting context for Lua-like feel in JavaScript
export interface ScriptingContext {
  send: (command: string) => void;
  echo: (text: string) => void;
  setVariable: (name: string, value: unknown) => void;
  getVariable: (name: string) => unknown;
  matches: string[];
  line: string;
}

export function createScriptingContext(
  sendFn: (cmd: string) => void,
  echoFn: (text: string) => void,
  matches: string[] = [],
  line: string = ""
): ScriptingContext {
  return {
    send: sendFn,
    echo: echoFn,
    setVariable: (name: string, value: unknown) => {
      scriptVariables[name] = value;
    },
    getVariable: (name: string) => {
      return scriptVariables[name];
    },
    matches,
    line,
  };
}

// Run a trigger script in a sandboxed context
export function runTriggerScript(
  script: string,
  context: ScriptingContext
): void {
  try {
    // Create a function with the Lua-like API available
    const fn = new Function(
      "send",
      "echo",
      "setVariable",
      "getVariable",
      "matches",
      "line",
      script
    );
    fn(
      context.send,
      context.echo,
      context.setVariable,
      context.getVariable,
      context.matches,
      context.line
    );
  } catch (err) {
    console.error("Script execution error:", err);
    context.echo(`[Script Error] ${(err as Error).message}`);
  }
}

// Process triggers against a line of text
export function processTriggers(
  line: string,
  triggers: MudTrigger[],
  context: ScriptingContext
): void {
  const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, ""); // Strip ANSI for matching

  for (const trigger of triggers) {
    if (!trigger.active) continue;

    try {
      let matches: string[] | null = null;

      if (trigger.type === "regex") {
        const regex = new RegExp(trigger.pattern, "i");
        const match = cleanLine.match(regex);
        if (match) {
          matches = Array.from(match);
        }
      } else {
        // Plain text match
        if (cleanLine.toLowerCase().includes(trigger.pattern.toLowerCase())) {
          matches = [trigger.pattern];
        }
      }

      if (matches) {
        const triggerContext = createScriptingContext(
          context.send,
          context.echo,
          matches,
          cleanLine
        );
        runTriggerScript(trigger.script, triggerContext);
      }
    } catch (err) {
      console.error("Trigger error:", err);
    }
  }
}

// Process an alias - returns the command to send or null if no match
export function processAlias(
  input: string,
  aliases: MudAlias[],
  sendFn: (cmd: string) => void,
  echoFn: (text: string) => void
): string | null {
  for (const alias of aliases) {
    if (!alias.active) continue;

    try {
      const regex = new RegExp(alias.pattern, "i");
      const match = input.match(regex);

      if (match) {
        // Replace $1, $2, etc. with captured groups
        let command = alias.command;
        for (let i = 1; i < match.length; i++) {
          command = command.replace(new RegExp(`\\$${i}`, "g"), match[i] || "");
        }
        return command;
      }
    } catch (err) {
      console.error("Alias error:", err);
    }
  }

  return null;
}

// Lua-like convenience functions that can be used in scripts
// These are exposed to the script context
export const luaLikeFunctions = `
-- Lua-like scripting reference for MUD Client
-- 
-- Available functions:
--   send(command)        - Send a command to the MUD
--   echo(text)           - Display text locally (not sent to MUD)
--   setVariable(name, value) - Store a variable
--   getVariable(name)    - Retrieve a stored variable
--
-- Available variables:
--   matches              - Array of regex matches (matches[0] is full match)
--   line                 - The full line that triggered this script
--
-- Example trigger script:
--   if (matches[1]) {
--     send("kill " + matches[1]);
--     echo("Attacking: " + matches[1]);
--   }
--
-- Example alias script (in command field, use $1, $2 for captures):
--   Pattern: ^tt (.*)$
--   Command: tell target $1
`;
