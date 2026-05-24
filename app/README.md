# AI Music App

React + TypeScript + Vite app bootstrapped through OpenSpec tasks.

## Stack

- Tailwind CSS v4
- shadcn/ui
- Transformers.js (local inference path)
- Hugging Face Inference API (remote inference path)
- Wrangler deployment config

## Direct MusicGen Example

The local app path now uses direct model loading and generation in runtime (model is downloaded and used directly in the program):

```ts
import {
  AutoTokenizer,
  MusicgenForConditionalGeneration,
  RawAudio,
} from "@huggingface/transformers";

const tokenizer = await AutoTokenizer.from_pretrained("Xenova/musicgen-small");
const model = await MusicgenForConditionalGeneration.from_pretrained(
  "Xenova/musicgen-small",
  {
    dtype: {
      text_encoder: "q8",
      decoder_model_merged: "q8",
      encodec_decode: "fp32",
    },
  },
);

const prompt =
  "a light and cheerly EDM track, with syncopated drums, aery pads, and strong emotions bpm: 130";
const inputs = tokenizer(prompt);

const audio_values = await model.generate({
  ...inputs,
  max_new_tokens: 500,
  do_sample: true,
  guidance_scale: 3,
});

const audio = new RawAudio(
  audio_values.data,
  model.config.audio_encoder.sampling_rate,
);
await audio.save("musicgen.wav");
```

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.dev.vars.example` and set values as needed.

- Local MusicGen runs directly in the app by default in development and downloads `Xenova/musicgen-small` on first use.
- Set `VITE_AI_SIMULATE=true` only if you want placeholder output instead of real model inference.
- Set `VITE_AI_SIMULATE=false` and provide `VITE_HF_TOKEN` to use remote Hugging Face calls.

## Verification

```bash
npm run lint
npm test
npm run build
```

## Deployment

Wrangler config: `wrangler.toml`

```bash
npm run wrangler:check
npm run deploy:wrangler
```

## OpenSpec Workflow

- Propose change: `openspec new change <name>`
- Implement change: `openspec instructions apply --change <name> --json`
- Archive change: `openspec archive <name> -y`
