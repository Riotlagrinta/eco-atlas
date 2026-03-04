import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export async function POST(req: NextRequest) {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const body = await req.json();
        const { image } = body; // Base64 image payload

        if (!image) {
            return NextResponse.json({ error: "L'image est requise." }, { status: 400 });
        }

        // Modèle vision actuel sur Groq (Llama 4 Scout est le remplaçant officiel)
        const model = 'meta-llama/llama-4-scout-17b-16e-instruct';

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: "Analyse cette image. Essaie de déterminer l'espèce (animale ou végétale) principale visible et si elle est sur la liste rouge IUCN. Réponds UNIQUEMENT via cet objet JSON très précis et structuré, sans aucun autre texte autour : {\"name\": \"Nom complet (français)\", \"scientific_name\": \"Nom latin\", \"description\": \"Courte description détaillée d'environ deux phrases avec des faits intéressants adaptés pour une observation.\", \"conservation_status\": \"LC|NT|VU|EN|CR|EW|EX|Inconnu\", \"category\": \"Fauna|Flora\"}" },
                        { type: 'image_url', image_url: { url: image } }
                    ]
                }
            ],
            model: model,
            temperature: 0.1, // Basse température pour des réponses factuelles et cohérentes
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const content = chatCompletion.choices[0]?.message?.content;

        if (!content) {
            throw new Error("L'IA n'a retourné aucune donnée.");
        }

        // Parse la réponse structurée JSON de l'IA
        const aiData = JSON.parse(content);
        return NextResponse.json({ success: true, data: aiData });

    } catch (error: any) {
        console.error('Erreur API Vision Groq:', error);
        return NextResponse.json({ error: error.message || "Erreur interne de reconnaissance visuelle." }, { status: 500 });
    }
}
