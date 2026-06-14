import { pipeline } from '@huggingface/transformers';

let generator: any = null;

export async function initRouterModel() {
  if (!generator) {
    console.log('[Router] Loading SmolLM2 for semantic routing...');
    // Utilizing Transformers.js directly to infer keywords
    generator = await pipeline('text-generation', 'Xenova/smol_lm2-360M', {
      device: 'wasm'
    });
    console.log('[Router] Model loaded.');
  }
}

export async function routeIntent(prompt: string): Promise<string[]> {
  await initRouterModel();
  
  // Create a structured prompt to force the model to output keywords
  const instruction = `Extract 3 to 5 keywords or specific topics from the user's request. Return only the keywords separated by commas.\nUser: ${prompt}\nKeywords:`;
  
  const results = await generator(instruction, {
    max_new_tokens: 30,
    temperature: 0.1,
    do_sample: false,
  });

  const generatedText = results[0].generated_text.replace(instruction, '').trim();
  const keywords = generatedText.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
  
  return keywords;
}
