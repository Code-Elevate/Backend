const axios = require("axios");
const assert = require("assert");

const baseURL = process.env.ENGINE_URL;
const runtimesURL = `${baseURL}/runtimes`;
const executionsURL = `${baseURL}/execute`;

const availableRuntimes = [
  "dart",
  "c",
  "c++",
  "go",
  "java",
  "javascript",
  "perl",
  "php",
  "python",
  "rscript",
  "ruby",
  "rust",
  "sqlite3",
  "swift",
  "typescript",
];

const cachedRuntimes = [];

const runtimes = async () => {
  if (cachedRuntimes.length === 0) {
    const { data } = await axios.get(runtimesURL);

    data.forEach((runtime) => {
      if (availableRuntimes.includes(runtime.language)) {
        cachedRuntimes.push(runtime);
      }
    });
  }

  return cachedRuntimes.map(({ language, version }) => ({ language, version }));
};

const getRuntime = async (language) => {
  await runtimes();
  let runtime = cachedRuntimes.find((runtime) => runtime.language === language);
  if (runtime) return runtime;

  for (let _runtime of cachedRuntimes) {
    if (_runtime.aliases.includes(language)) {
      runtime = _runtime;
      break;
    }
  }

  assert(runtime, "Runtime not found.");
  return runtime;
};

const execute = async (
  language,
  version,
  code,
  stdin = "",
  compile_timeout = null,
  run_timeout = null,
  compile_memory_limit = null,
  run_memory_limit = null
) => {
  assert(language, "Language is required.");
  assert(version, "Version is required.");
  assert(code, "Code is required.");

  // stdin should be a string or an array of strings
  assert(
    typeof stdin === "string" || Array.isArray(stdin),
    "stdin should be a string or an array of strings."
  );

  // Ge PARRALEL_EXECUTIONS from environment
  const parrallel_executions = process.env.PARRALEL_EXECUTIONS === "true";

  let result;
  let status = "success";

  if (typeof stdin === "string" || parrallel_executions) {
    result = await axios.post(executionsURL, {
      language,
      version,
      files: [{ content: code }],
      stdin,
      ...(compile_timeout && { compile_timeout }),
      ...(run_timeout && { run_timeout }),
      ...(compile_memory_limit && { compile_memory_limit }),
      ...(run_memory_limit && { run_memory_limit }),
    });

    if (result.data.run && Array.isArray(result.data.run)) {
      result.data.run.forEach((run) => {
        run.stdout = run.stdout.trim();
        run.stderr = run.stderr.trim();
        run.output = run.output.trim();

        if (run.code !== 0) {
          status = "runtime_error";
        }

        if (run.code === null) {
          status = "timeout";
        }
      });
    } else {
      result.data.run = {
        ...result.data.run,
        stdout: result.data.run.stdout.trim(),
        stderr: result.data.run.stderr.trim(),
        output: result.data.run.output.trim(),
      };

      if (result.data.run.code !== 0) {
        status = "runtime_error";
      }

      if (result.data.run.code === null) {
        status = "timeout";
      }
    }

    if (result.data.compile) {
      result.data.compile = {
        ...result.data.compile,
        stdout: result.data.compile.stdout.trim(),
        stderr: result.data.compile.stderr.trim(),
        output: result.data.compile.output.trim(),
      };

      if (result.data.compile.code !== 0) {
        status = "compile_error";
      }

      if (result.data.compile.code === null) {
        status = "timeout";
      }
    }

    return { ...result.data, status };
  }

  result = await Promise.all(
    stdin.map(async (input, index) => {
      await new Promise((resolve) => setTimeout(resolve, 250 * index));
      return axios.post(executionsURL, {
        language,
        version,
        files: [{ content: code }],
        stdin: input,
        ...(compile_timeout && { compile_timeout }),
        ...(run_timeout && { run_timeout }),
        ...(compile_memory_limit && { compile_memory_limit }),
        ...(run_memory_limit && { run_memory_limit }),
      });
    })
  );

  // Combine all runs into a single object
  result = result.map((res) => res.data);
  result[0].run = result.map((res) => res.run || res.compile);

  result[0].run.forEach((run) => {
    run.stdout = run.stdout.trim();
    run.stderr = run.stderr.trim();
    run.output = run.output.trim();

    if (run.code !== 0) {
      status = "runtime_error";
    }

    if (run.code === null) {
      status = "timeout";
    }
  });

  if (result[0].compile) {
    result[0].compile = {
      ...result[0].compile,
      stdout: result[0].compile.stdout.trim(),
      stderr: result[0].compile.stderr.trim(),
      output: result[0].compile.output.trim(),
    };

    if (result[0].compile.code !== 0) {
      status = "compile_error";
    }

    if (result[0].compile.code === null) {
      status = "timeout";
    }
  }

  return { ...result[0], status };
};

module.exports = {
  runtimes,
  getRuntime,
  execute,
};
