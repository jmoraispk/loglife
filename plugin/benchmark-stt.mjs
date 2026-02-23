#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    audio: { type: "string" },
    "openai-key": { type: "string" },
    "assemblyai-key": { type: "string" },
    "openai-model": { type: "string", default: "gpt-4o-mini-transcribe" },
    runs: { type: "string", default: "3" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help || !values.audio) {
  console.log(`Usage: node benchmark-stt.mjs --audio <path> [options]

Options:
  --audio            Path to audio file (required)
  --openai-key       OpenAI API key (skip OpenAI if omitted)
  --assemblyai-key   AssemblyAI API key (skip AssemblyAI if omitted)
  --openai-model     OpenAI model (default: gpt-4o-mini-transcribe)
  --runs             Number of runs per provider (default: 3)
  -h, --help         Show this help`);
  process.exit(values.help ? 0 : 1);
}

const audioPath = values.audio;
const runs = Math.max(1, parseInt(values.runs, 10) || 3);
const audioBuffer = await readFile(audioPath);
const fileName = basename(audioPath);

console.log(`\nAudio file: ${audioPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
console.log(`Runs per provider: ${runs}\n`);

async function timeMs(fn) {
  const start = performance.now();
  const result = await fn();
  const elapsed = performance.now() - start;
  return { result, elapsed };
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: times.reduce((a, b) => a + b, 0) / times.length,
  };
}

// --- OpenAI ---

async function transcribeOpenAI(apiKey, model) {
  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: "application/octet-stream" });
  form.append("file", blob, fileName);
  form.append("model", model);

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.text;
}

// --- AssemblyAI ---

async function transcribeAssemblyAI(apiKey) {
  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: audioBuffer,
  });
  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    throw new Error(`AssemblyAI upload ${uploadRes.status}: ${body}`);
  }
  const { upload_url } = await uploadRes.json();

  const submitRes = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio_url: upload_url }),
  });
  if (!submitRes.ok) {
    const body = await submitRes.text();
    throw new Error(`AssemblyAI submit ${submitRes.status}: ${body}`);
  }
  const { id } = await submitRes.json();

  let polls = 0;
  while (true) {
    polls++;
    await new Promise((r) => setTimeout(r, 500));
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { Authorization: apiKey },
    });
    if (!pollRes.ok) {
      const body = await pollRes.text();
      throw new Error(`AssemblyAI poll ${pollRes.status}: ${body}`);
    }
    const data = await pollRes.json();
    if (data.status === "completed") {
      return { text: data.text, polls };
    }
    if (data.status === "error") {
      throw new Error(`AssemblyAI error: ${data.error}`);
    }
    if (polls > 120) {
      throw new Error("AssemblyAI: polling timed out after 60s");
    }
  }
}

// --- Run benchmarks ---

const results = {};

if (values["openai-key"]) {
  const model = values["openai-model"];
  console.log(`--- OpenAI (${model}) ---`);
  const times = [];
  let lastText = "";
  for (let i = 0; i < runs; i++) {
    try {
      const { result, elapsed } = await timeMs(() =>
        transcribeOpenAI(values["openai-key"], model),
      );
      times.push(elapsed);
      lastText = result;
      console.log(`  Run ${i + 1}: ${elapsed.toFixed(0)}ms`);
    } catch (err) {
      console.log(`  Run ${i + 1}: ERROR - ${err.message}`);
    }
  }
  if (times.length > 0) {
    const s = stats(times);
    console.log(`  Min: ${s.min.toFixed(0)}ms | Avg: ${s.avg.toFixed(0)}ms | Max: ${s.max.toFixed(0)}ms`);
    console.log(`  Text (${lastText.length} chars): "${lastText.slice(0, 120)}${lastText.length > 120 ? "..." : ""}"`);
    results.openai = { ...s, text: lastText };
  }
  console.log();
}

if (values["assemblyai-key"]) {
  console.log("--- AssemblyAI ---");
  const times = [];
  let lastText = "";
  let lastPolls = 0;
  for (let i = 0; i < runs; i++) {
    try {
      const { result, elapsed } = await timeMs(() =>
        transcribeAssemblyAI(values["assemblyai-key"]),
      );
      times.push(elapsed);
      lastText = result.text;
      lastPolls = result.polls;
      console.log(`  Run ${i + 1}: ${elapsed.toFixed(0)}ms (${result.polls} polls)`);
    } catch (err) {
      console.log(`  Run ${i + 1}: ERROR - ${err.message}`);
    }
  }
  if (times.length > 0) {
    const s = stats(times);
    console.log(`  Min: ${s.min.toFixed(0)}ms | Avg: ${s.avg.toFixed(0)}ms | Max: ${s.max.toFixed(0)}ms`);
    console.log(`  Polls (last run): ${lastPolls}`);
    console.log(`  Text (${lastText.length} chars): "${lastText.slice(0, 120)}${lastText.length > 120 ? "..." : ""}"`);
    results.assemblyai = { ...s, text: lastText };
  }
  console.log();
}

// --- Summary ---

if (results.openai && results.assemblyai) {
  const diff = results.assemblyai.avg - results.openai.avg;
  const ratio = results.assemblyai.avg / results.openai.avg;
  console.log("=== Summary ===");
  console.log(`OpenAI avg:     ${results.openai.avg.toFixed(0)}ms`);
  console.log(`AssemblyAI avg: ${results.assemblyai.avg.toFixed(0)}ms`);
  console.log(`Difference:     ${diff > 0 ? "+" : ""}${diff.toFixed(0)}ms (${ratio.toFixed(1)}x)`);
  if (diff > 0) {
    console.log(`AssemblyAI is ${ratio.toFixed(1)}x slower on average`);
  } else {
    console.log(`AssemblyAI is ${(1 / ratio).toFixed(1)}x faster on average`);
  }
}
