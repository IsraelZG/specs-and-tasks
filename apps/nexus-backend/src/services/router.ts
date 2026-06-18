import { pipeline } from '@huggingface/transformers';

let generator: any = null;

export async function initRouterModel() {
  if (!generator) {
    console.error('[Router] Loading SmolLM2 for semantic routing...');
    try {
      // Utilizing Transformers.js directly to infer keywords
      generator = await pipeline('text-generation', 'Xenova/smol_lm2-360M', {
        device: 'wasm'
      });
      console.error('[Router] Model loaded.');
    } catch (err: any) {
      console.error('[Router] Failed to load SmolLM2 model. Using fallback keyword extractor:', err.message);
      generator = 'fallback';
    }
  }
}

export async function routeIntent(prompt: string): Promise<string[]> {
  if (process.env.MOCK_MODEL === 'true') {
    const keywords: string[] = [];
    if (/auth|login|security/i.test(prompt)) keywords.push('authentication');
    if (/connection|network|port/i.test(prompt)) keywords.push('connection');
    if (/database|db|schema|migration/i.test(prompt)) keywords.push('database');
    if (keywords.length === 0) keywords.push('general', 'context');
    return keywords;
  }

  await initRouterModel();

  if (generator === 'fallback') {
    const words = prompt.toLowerCase().split(/\W+/);
    const stopWords = new Set(['i', 'need', 'to', 'check', 'the', 'a', 'and', 'for', 'or', 'in', 'on', 'at', 'with', 'about', 'how', 'do', 'we']);
    const keywords = words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .filter((v, i, a) => a.indexOf(v) === i);
    return keywords.length > 0 ? keywords.slice(0, 5) : ['context'];
  }
  
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
