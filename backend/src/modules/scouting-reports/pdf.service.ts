import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ScoutingReportsService } from './scouting-reports.service';

@Injectable()
export class PdfService {
  private readonly margin = 42;

  constructor(private readonly reportsService: ScoutingReportsService) {}

  async generateReportPdf(reportId: string): Promise<Buffer> {
    const report = await this.reportsService.findOne(reportId);

    if (!report) {
      throw new NotFoundException(`Rapport avec l'ID ${reportId} introuvable`);
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: this.margin,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = this.drawHeader(doc, report);
      y = this.drawIdentityBlock(doc, report, y);
      y = this.drawNarrativeSection(
        doc,
        y,
        'Habilete technique avec ballon',
        report.withBallAnalysis || report.strengths,
      );
      y = this.drawNarrativeSection(
        doc,
        y,
        'Jeu sans ballon',
        report.offBallAnalysis || report.weaknesses,
      );
      y = this.drawNarrativeSection(
        doc,
        y,
        'Qualites physiques (Vitesse, Force, Puissance, Coordination)',
        this.buildPhysicalSummary(report),
      );
      y = this.drawNarrativeSection(
        doc,
        y,
        'Reflexion / Intelligence de jeu',
        report.gameIntelligenceAnalysis || report.summary,
      );
      y = this.drawNarrativeSection(doc, y, 'Attitude', report.attitudeAnalysis);
      y = this.drawNarrativeSection(
        doc,
        y,
        'Avis du Scout-Staff',
        report.staffOpinion || report.recommendationNotes,
      );
      y = this.drawAthleticTests(doc, y, report);
      y = this.drawVerdictGrid(doc, y, report.recommendation);

      this.drawFooter(doc);
      doc.end();
    });
  }

  private drawHeader(doc: PDFKit.PDFDocument, report: any): number {
    const width = doc.page.width - this.margin * 2;
    const title = `RAPPORT TYPE ARCANE FOOTBALL - JOUEUR EN TEST`;

    doc.rect(this.margin, this.margin, width, 26).fill('#000000');

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#FFFFFF')
      .text(title, this.margin, this.margin + 8, {
        align: 'center',
        width,
      });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, this.margin, this.margin + 30);

    return this.margin + 48;
  }

  private drawIdentityBlock(doc: PDFKit.PDFDocument, report: any, y: number): number {
    const width = doc.page.width - this.margin * 2;
    const rowHeight = 19;
    const x = this.margin;

    const fullName = this.getPlayerFullName(report);
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    const dateOfBirth = report.player?.dateOfBirth || report.player?.user?.dateOfBirth;
    const birthDate = dateOfBirth
      ? new Date(dateOfBirth).toLocaleDateString('fr-FR')
      : 'non renseigne';
    const position = report.playerPosition || report.player?.position || 'non renseigne';
    const dominantFoot =
      report.observedDominantFoot || report.player?.preferredFoot || 'non renseigne';
    const heightCm = report.observedHeightCm ?? report.player?.height;
    const weightKg = report.observedWeightKg ?? report.player?.weight;
    const clubName =
      report.observedClubName ||
      report.player?.club?.name ||
      report.player?.clubs?.name ||
      report.match?.homeClub?.name ||
      'non renseigne';

    const lines = [
      `Nom : ${lastName || 'non renseigne'}`,
      `Prenom : ${firstName || 'non renseigne'}`,
      `Ne le : ${birthDate}`,
      `Poste : ${position}    Pied : ${dominantFoot}`,
      `Taille : ${heightCm ? `${heightCm} cm` : 'non renseigne'}    Poids : ${weightKg ? `${weightKg} kg` : 'non renseigne'}`,
      `Club observe : ${clubName}`,
    ];

    const height = lines.length * rowHeight + 14;
    y = this.ensureSpace(doc, y, height + 10);

    doc.rect(x, y, width, height).fill('#F4F4F4').stroke('#222222');

    doc.font('Helvetica').fontSize(10).fillColor('#111111');

    lines.forEach((line, index) => {
      doc.text(line, x + 10, y + 8 + index * rowHeight, { width: width - 20 });
    });

    return y + height + 10;
  }

  private drawNarrativeSection(
    doc: PDFKit.PDFDocument,
    y: number,
    title: string,
    content?: string,
  ): number {
    const width = doc.page.width - this.margin * 2;
    const x = this.margin;
    const normalized = this.normalizeText(content);
    const textHeight = doc.heightOfString(normalized, {
      width: width - 20,
      align: 'left',
      lineGap: 2,
    });
    const blockHeight = 30 + textHeight;

    y = this.ensureSpace(doc, y, blockHeight + 8);

    doc.rect(x, y, width, blockHeight).fill('#EFEFEF').stroke('#222222');

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111111')
      .text(`${title} :`, x + 10, y + 8, {
        width: width - 20,
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111111')
      .text(normalized, x + 10, y + 24, {
        width: width - 20,
        align: 'left',
        lineGap: 2,
      });

    return y + blockHeight + 8;
  }

  private drawAthleticTests(doc: PDFKit.PDFDocument, y: number, report: any): number {
    const width = doc.page.width - this.margin * 2;
    const x = this.margin;
    const blockHeight = 58;

    y = this.ensureSpace(doc, y, blockHeight + 12);

    doc.rect(x, y, width, blockHeight).fill('#EFEFEF').stroke('#222222');

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#111111')
      .text('Tests athletiques :', x + 10, y + 8);

    const testsLine = [
      `10m : ${this.formatMetric(report.sprint10mSec, 's')}`,
      `20m : ${this.formatMetric(report.sprint20mSec, 's')}`,
      `40m : ${this.formatMetric(report.sprint40mSec, 's')}`,
      `VMA : ${this.formatMetric(report.vmaKmh, 'km/h')}`,
    ].join('     ');

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#111111')
      .text(testsLine, x + 10, y + 30, {
        width: width - 20,
      });

    return y + blockHeight + 12;
  }

  private drawVerdictGrid(doc: PDFKit.PDFDocument, y: number, recommendation?: string): number {
    const width = doc.page.width - this.margin * 2;
    const x = this.margin;
    const headerHeight = 34;
    const valueHeight = 32;
    const totalHeight = headerHeight + valueHeight;
    const columnWidth = width / 3;

    y = this.ensureSpace(doc, y, totalHeight + 20);

    doc.rect(x, y, width, totalHeight).fill('#F6F6F6').stroke('#222222');

    doc
      .moveTo(x + columnWidth, y)
      .lineTo(x + columnWidth, y + totalHeight)
      .stroke('#222222');
    doc
      .moveTo(x + 2 * columnWidth, y)
      .lineTo(x + 2 * columnWidth, y + totalHeight)
      .stroke('#222222');
    doc
      .moveTo(x, y + headerHeight)
      .lineTo(x + width, y + headerHeight)
      .stroke('#222222');

    const labels = ['JOUEUR A SIGNER', 'JOUEUR A SUIVRE', 'PAS AU NIVEAU'];
    labels.forEach((label, index) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#111111')
        .text(label, x + index * columnWidth, y + 11, {
          width: columnWidth,
          align: 'center',
        });
    });

    const markers = this.getVerdictMarkers(recommendation);
    markers.forEach((marker, index) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#111111')
        .text(marker, x + index * columnWidth, y + headerHeight + 8, {
          width: columnWidth,
          align: 'center',
        });
    });

    return y + totalHeight + 16;
  }

  private drawFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i += 1) {
      doc.switchToPage(i);

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666666')
        .text(
          `Rapport Arcane Football - Page ${i + 1}/${pageCount}`,
          this.margin,
          doc.page.height - 26,
          {
            width: doc.page.width - this.margin * 2,
            align: 'center',
          },
        );
    }
  }

  private ensureSpace(doc: PDFKit.PDFDocument, y: number, neededHeight: number): number {
    const bottomLimit = doc.page.height - this.margin - 28;
    if (y + neededHeight <= bottomLimit) {
      return y;
    }

    doc.addPage();
    return this.margin;
  }

  private normalizeText(content?: string): string {
    if (!content || !content.trim()) {
      return 'Non renseigne';
    }
    return content.trim();
  }

  private formatMetric(value?: number | null, unit?: string): string {
    if (value === undefined || value === null) {
      return 'non renseigne';
    }
    return unit ? `${value} ${unit}` : `${value}`;
  }

  private buildPhysicalSummary(report: any): string {
    const observedText = report.summary?.trim();
    if (observedText) {
      return observedText;
    }

    const physicalRating = report.physicalRating;
    if (typeof physicalRating === 'number') {
      return `Evaluation physique estimee a ${physicalRating}/100 (vitesse, puissance et coordination).`;
    }

    return 'Non renseigne';
  }

  private getPlayerFullName(report: any): string {
    const firstName = report.player?.user?.firstName || '';
    const lastName = report.player?.user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Joueur inconnu';
  }

  private getVerdictMarkers(recommendation?: string): [string, string, string] {
    if (recommendation === 'BUY_NOW') {
      return ['X', '', ''];
    }

    if (
      recommendation === 'MONITOR' ||
      recommendation === 'FOLLOW_UP' ||
      recommendation === 'NEEDS_MORE_DATA'
    ) {
      return ['', 'X', ''];
    }

    if (recommendation === 'NOT_INTERESTED') {
      return ['', '', 'X'];
    }

    return ['', '', ''];
  }
}
