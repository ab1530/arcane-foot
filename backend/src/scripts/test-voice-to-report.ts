import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VoiceToReportService } from '../modules/voice-to-report/voice-to-report.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script for Voice-to-Report functionality
 *
 * This script tests:
 * 1. Text-based extraction (without audio files)
 * 2. Multiple languages
 * 3. Different report formats
 * 4. Edge cases
 */

const testTranscriptions = [
  {
    name: 'Complete English Report',
    language: 'en',
    text: `This is a scouting report for John Doe, center back, number 5, playing for Real Madrid against Barcelona in La Liga at Santiago Bernabéu on February 15th 2024. Technical rating: 8 out of 10. Physical rating: 9 out of 10. Tactical rating: 7 out of 10. Mental rating: 8 out of 10. Overall rating: 8 out of 10. Strengths: Excellent positioning, strong in the air, good passing range. Weaknesses: Can be slow to turn, sometimes caught out of position on counter-attacks. Key moments: Made a crucial block in the 67th minute, won every aerial duel in the second half. Overall impression: Top-quality defender with Champions League potential. Played 90 minutes. Recommendation: Sign.`,
  },
  {
    name: 'Spanish Report',
    language: 'es',
    text: `Informe de scouting para Juan Pérez, delantero centro, número 9, jugando para Barcelona contra Real Madrid en La Liga el 20 de febrero. Valoración técnica: 9 sobre 10. Valoración física: 8 sobre 10. Valoración táctica: 8 sobre 10. Valoración mental: 9 sobre 10. Fortalezas: excelente finalización, muy rápido, buen regate. Debilidades: a veces egoísta, puede mejorar el juego aéreo. Momentos clave: marcó dos goles en la segunda mitad. Impresión general: delantero de clase mundial. Jugó 85 minutos. Recomendación: fichar.`,
  },
  {
    name: 'French Report',
    language: 'fr',
    text: `Rapport de scouting pour Pierre Martin, milieu de terrain, numéro 10, jouant pour PSG contre Lyon en Ligue 1 au Parc des Princes. Note technique: 8 sur 10. Note physique: 7 sur 10. Note tactique: 9 sur 10. Note mentale: 8 sur 10. Forces: excellente vision du jeu, passes précises, leadership. Faiblesses: manque de vitesse, défense à améliorer. Moments clés: a délivré deux passes décisives. A joué 78 minutes. Recommandation: suivre.`,
  },
  {
    name: 'Minimal English Report',
    language: 'en',
    text: `Scouting report for Alex Johnson. Position: midfielder. Technical: 7. Physical: 8. Good player, fast and technical. Recommendation: monitor.`,
  },
  {
    name: 'Report with 0-100 Scale',
    language: 'en',
    text: `This is a report for Michael Smith, striker, number 9. Technical rating: 85. Physical rating: 90. Tactical rating: 75. Mental rating: 80. He's an excellent finisher with great pace. Sometimes wasteful. Played 60 minutes. Recommendation: sign.`,
  },
  {
    name: 'Informal Report',
    language: 'en',
    text: `Just watched Robert Williams play. He's a right back, very solid defensively but limited going forward. I'd rate his defending at 8 out of 10 but his attacking only 5. Strong in tackles, reads the game well. Could be a good backup option. I'd say monitor him for now.`,
  },
];

async function main() {
  console.log('🎤 Voice-to-Report Test Script\n');
  console.log('='.repeat(80));

  // Bootstrap NestJS app
  const app = await NestFactory.createApplicationContext(AppModule);
  const voiceToReportService = app.get(VoiceToReportService);

  // Test 1: Get supported languages
  console.log('\n📋 Test 1: Supported Languages');
  console.log('-'.repeat(80));
  const languages = voiceToReportService.getSupportedLanguages();
  console.log('Supported languages:', languages.map((l) => `${l.name} (${l.code})`).join(', '));

  // Test 2: Get examples
  console.log('\n📋 Test 2: Example Templates');
  console.log('-'.repeat(80));
  const examples = voiceToReportService.getExamples();
  console.log(`Found ${examples.length} example templates`);
  examples.forEach((example, idx) => {
    console.log(`\n  ${idx + 1}. ${example.language.toUpperCase()}:`);
    console.log(`     - Prompt length: ${example.prompt.length} characters`);
    console.log(`     - Tips: ${example.tips.length} tips provided`);
  });

  // Test 3: Process test transcriptions
  console.log('\n📋 Test 3: Process Test Transcriptions');
  console.log('-'.repeat(80));

  for (const test of testTranscriptions) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   Language: ${test.language}`);
    console.log(`   Text length: ${test.text.length} characters`);

    try {
      // Use internal methods for testing
      const extractedData = await (voiceToReportService as any).extractReportData(
        test.text,
        test.language,
      );

      const { data: validatedData, warnings } = await (voiceToReportService as any).validateData(
        extractedData,
      );

      const confidence = (voiceToReportService as any).calculateConfidence(
        validatedData,
        test.text,
      );

      const suggestions = (voiceToReportService as any).generateSuggestions(
        validatedData,
        warnings,
      );

      // Display results
      console.log(`\n   ✅ Results:`);
      console.log(`      - Player: ${validatedData.playerName || 'N/A'}`);
      console.log(`      - Position: ${validatedData.position || 'N/A'}`);
      console.log(`      - Jersey: ${validatedData.jerseyNumber || 'N/A'}`);
      console.log(`      - Team: ${validatedData.team || 'N/A'}`);
      console.log(`      - Opponent: ${validatedData.opponent || 'N/A'}`);

      console.log(`\n   📊 Ratings:`);
      console.log(`      - Technical: ${validatedData.technicalRating || 'N/A'}`);
      console.log(`      - Physical: ${validatedData.physicalRating || 'N/A'}`);
      console.log(`      - Tactical: ${validatedData.tacticalRating || 'N/A'}`);
      console.log(`      - Mental: ${validatedData.mentalRating || 'N/A'}`);
      console.log(`      - Overall: ${validatedData.overallRating || 'N/A'}`);

      console.log(`\n   💪 Strengths: ${validatedData.strengths || 'N/A'}`);
      console.log(`   ⚠️  Weaknesses: ${validatedData.weaknesses || 'N/A'}`);
      console.log(`   ⚡ Key Moments: ${validatedData.keyMoments || 'N/A'}`);
      console.log(`   🎯 Recommendation: ${validatedData.recommendation || 'N/A'}`);
      console.log(`   ⏱️  Minutes: ${validatedData.minutesPlayed || 'N/A'}`);

      if (validatedData.tags && validatedData.tags.length > 0) {
        console.log(`   🏷️  Tags: ${validatedData.tags.join(', ')}`);
      }

      console.log(`\n   📈 Confidence: ${confidence}%`);

      if (warnings.length > 0) {
        console.log(`\n   ⚠️  Warnings:`);
        warnings.forEach((w) => console.log(`      - ${w}`));
      }

      if (suggestions.length > 0) {
        console.log(`\n   💡 Suggestions:`);
        suggestions.forEach((s) => console.log(`      - ${s}`));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 4: Edge cases
  console.log('\n📋 Test 4: Edge Cases');
  console.log('-'.repeat(80));

  const edgeCases = [
    {
      name: 'Empty text',
      text: '',
    },
    {
      name: 'Very short text',
      text: 'John Doe midfielder',
    },
    {
      name: 'No ratings',
      text: 'This is a report for Tom Wilson. He played well today.',
    },
    {
      name: 'Invalid rating values',
      text: 'Player: Mike Jones. Technical: 15 out of 10. Physical: -5.',
    },
  ];

  for (const test of edgeCases) {
    console.log(`\n🔍 Testing: ${test.name}`);
    try {
      const extractedData = await (voiceToReportService as any).extractReportData(test.text, 'en');
      const { data, warnings } = await (voiceToReportService as any).validateData(extractedData);
      const confidence = (voiceToReportService as any).calculateConfidence(data, test.text);

      console.log(`   ✅ Processed (Confidence: ${confidence}%)`);
      console.log(
        `      - Fields extracted: ${Object.keys(data).filter((k) => data[k] != null).length}`,
      );
      if (warnings.length > 0) {
        console.log(`      - Warnings: ${warnings.length}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test completed successfully!');
  console.log('\n📝 Summary:');
  console.log(`   - Tested ${testTranscriptions.length} complete reports`);
  console.log(`   - Tested ${edgeCases.length} edge cases`);
  console.log(`   - Supported languages: ${languages.length}`);
  console.log(`   - Example templates: ${examples.length}`);

  console.log('\n💡 Next steps:');
  console.log('   1. Test with actual audio files (requires OPENAI_API_KEY)');
  console.log('   2. Test the HTTP endpoints using curl or Postman');
  console.log('   3. Integrate with frontend voice recording component');
  console.log('   4. Test multilingual voice recordings');
  console.log('\n');

  await app.close();
}

// Run the test
main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
