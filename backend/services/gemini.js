const axios = require('axios');

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function fetchMedicineDetails(medicineName, dosageOrBrand) {
  const prompt = `For the medicine ${medicineName} ${dosageOrBrand || ''}:
1. Provide a concise summary of what it is and how it works.
2. List common side effects and their frequency/severity.
3. List serious/rare side effects with warnings.
4. Mention key precautions, expected effects, and anything a patient should know before taking.
5. Summarize in clear, user-friendly bullet points or a structured JSON object.

Format your response as:
{
  "name": "",
  "summary": "",
  "common_side_effects": [],
  "serious_side_effects": [],
  "precautions": [],
  "expected_effects": []
}`;

  try {
    const response = await axios.post(
      GEMINI_ENDPOINT,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );
    // Parse Gemini's response
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Try to parse as JSON
    let details;
    try {
      details = JSON.parse(text);
    } catch (e) {
      details = { raw: text };
    }
    return details;
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    throw new Error('Failed to fetch medicine details from Gemini');
  }
}

async function fetchDrugInteractions(medicineList) {
  const prompt = `Given these medicines: ${medicineList.join(', ')}\n\nAnalyze potential drug interactions and provide a detailed response in the following format:\n[\n  {\n    \"drugA\": \"name and common brands\",\n    \"drugB\": \"name and common brands\",\n    \"severity\": \"major/moderate/minor\",\n    \"description\": \"plain language explanation of the interaction\",\n    \"management\": \"advice on how to handle this combination\"\n  }\n]\nReturn only the JSON array, no other text.`;
  try {
    const response = await axios.post(
      GEMINI_ENDPOINT,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        params: { key: process.env.GEMINI_API_KEY },
        headers: { 'Content-Type': 'application/json' }
      }
    );
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let interactions;
    try {
      interactions = JSON.parse(text);
    } catch (e) {
      interactions = [];
    }
    return interactions;
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    throw new Error('Failed to check drug interactions');
  }
}

module.exports = { fetchMedicineDetails, fetchDrugInteractions }; 