// Fichier : netlify/functions/send-simulation.js
// Version gérant le nouveau simulateur de loyer Bordeaux

const { Resend } = require('resend');

function getEmailBody(theme, data) {
    const commonFooter = `
        <p style="margin-top: 25px;">Pour une analyse complète et des conseils adaptés à votre situation, n'hésitez pas à nous contacter.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>L'équipe Aeternia Patrimoine</strong></p>
    `;

    if (theme === 'Loyer Bordeaux') {
        const { objectifs, resultats } = data;
        return `
            <p>Merci d'avoir utilisé notre simulateur. Voici le résumé de votre estimation pour l'encadrement des loyers à Bordeaux :</p>
            <h3 style="color: #333;">Caractéristiques de votre logement :</h3>
            <ul style="list-style-type: none; padding-left: 0; border-left: 3px solid #00FFD2; padding-left: 15px;">
                <li><strong>Zone :</strong> ${objectifs.zone}</li>
                <li><strong>Nombre de pièces :</strong> ${objectifs.pieces}</li>
                <li><strong>Surface :</strong> ${objectifs.surface}</li>
                <li><strong>Type de location :</strong> ${objectifs.typeLocation}</li>
            </ul>
            <h3 style="color: #333;">Résultats de votre simulation :</h3>
            <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="font-size: 16px; margin: 10px 0;">Loyer maximum autorisé : <strong style="color: #00877a;">${resultats.loyerMajore}</strong></p>
                <p style="font-size: 14px; color: #555; margin: 10px 0;">(Loyer de référence : ${resultats.loyerRef} / Loyer minoré : ${resultats.loyerMinore})</p>
            </div>
            ${commonFooter}
        `;
    }
    
    // ... (ici, les autres templates que nous avons déjà faits) ...
    // Fallback au cas où
    return `<p>Merci d'avoir utilisé nos services.</p>${commonFooter}`;
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = JSON.parse(event.body);
    const { email, data, theme = 'default' } = body;

    if (!data) {
        throw new Error("Données de simulation manquantes.");
    }
    
    const emailSubjects = {
        'Loyer Bordeaux': "Votre simulation d'encadrement de loyer à Bordeaux",
        // ... (autres sujets)
        'default': `Votre simulation Aeternia Patrimoine`
    };

    const subject = emailSubjects[theme] || emailSubjects['default'];
    const emailBodyHtml = getEmailBody(theme, data);

    await resend.emails.send({
      from: 'Aeternia Patrimoine <contact@aeterniapatrimoine.fr>', 
      to: [email],
      bcc: ['contact@aeterniapatrimoine.fr'],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333;">Bonjour,</h2>
          ${emailBodyHtml}
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
          <p style="font-size: 10px; color: #777; text-align: center; margin-top: 20px;">
            Les informations et résultats fournis par ce simulateur sont donnés à titre indicatif et non contractuel. Ils sont basés sur les hypothèses de calcul et les paramètres que vous avez renseignés et ne constituent pas un conseil en investissement.
          </p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email envoyé avec succès !' }),
    };

  } catch (error) {
    console.error("Erreur dans la fonction Netlify :", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Une erreur est survenue lors de l'envoi de l'email." }),
    };
  }
};
