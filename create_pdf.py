import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Vietnamese supporting font (Arial is common on Windows)
try:
    pdfmetrics.registerFont(TTFont('Arial', 'C:\\Windows\\Fonts\\arial.ttf'))
    pdfmetrics.registerFont(TTFont('Arial-Bold', 'C:\\Windows\\Fonts\\arialbd.ttf'))
    pdfmetrics.registerFont(TTFont('Arial-Italic', 'C:\\Windows\\Fonts\\ariali.ttf'))
    font_name = 'Arial'
    font_bold = 'Arial-Bold'
    font_italic = 'Arial-Italic'
except:
    font_name = 'Helvetica'
    font_bold = 'Helvetica-Bold'
    font_italic = 'Helvetica-Oblique'

def create_overview_pdf(md_path, pdf_path):
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Title'],
        fontName=font_bold,
        fontSize=24,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName=font_bold,
        fontSize=18,
        spaceBefore=15,
        spaceAfter=10,
        textColor='#34495E'
    )

    h3_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Heading3'],
        fontName=font_bold,
        fontSize=14,
        spaceBefore=10,
        spaceAfter=5
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=11,
        leading=14,
        spaceAfter=10,
        alignment=TA_LEFT
    )

    story = []
    
    if not os.path.exists(md_path):
        print(f"File not found: {md_path}")
        return

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line:
            story.append(Spacer(1, 8))
            continue
            
        if line.startswith('# '):
            story.append(Paragraph(line[2:], title_style))
        elif line.startswith('## '):
            story.append(Paragraph(line[3:], heading_style))
        elif line.startswith('### '):
            story.append(Paragraph(line[4:], h3_style))
        elif line.startswith('- '):
            # Clean Markdown Bold/Italic simple handling
            clean_line = line[2:].replace('**', '').replace('*', '')
            story.append(Paragraph(f"• {clean_line}", body_style))
        else:
            clean_line = line.replace('**', '').replace('*', '')
            story.append(Paragraph(clean_line, body_style))

    # Add a footer/ending
    story.append(Spacer(1, 30))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontName=font_italic, fontSize=9, alignment=TA_CENTER)
    story.append(Paragraph("Tài liệu được soạn thảo tự động bởi Tiểu Mỹ (Antigravity).", footer_style))

    doc.build(story)
    print(f"PDF created at: {pdf_path}")

if __name__ == "__main__":
    create_overview_pdf('PROJECT_OVERVIEW.md', 'PROJECT_OVERVIEW.pdf')
