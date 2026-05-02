import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

interface Slide {
  title: string;
  headMessage: string;
  content: string[];
  rtb: {
    evidence: string;
    metric: string;
    source: string;
  };
}

interface SlidePDFProps {
  slides: Slide[];
}

/* 폰트 안정화 (TTF 포맷 사용) */
Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosanskr/v27/P6xVpS3yc-9S6nyW27z9-v7W762-dw.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosanskr/v27/P6xWpS3yc-9S6nyW27z9-v7W762-dw.ttf",
      fontWeight: 700,
    }
  ]
});

/* A4 Landscape Layout */
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 50,
    paddingRight: 50,
    backgroundColor: "#ffffff",
    fontFamily: "NotoSans",
    flexDirection: "column"
  },
  header: {
    borderBottom: "2 solid #002d72",
    paddingBottom: 10,
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    color: "#002d72",
    fontWeight: 700,
    marginBottom: 4
  },
  headMessage: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 400,
    fontStyle: "italic"
  },
  mainContent: {
    flexDirection: "row",
    gap: 20,
    flex: 1
  },
  leftCol: {
    flex: 7,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 15,
    border: "1 solid #e5e5e5"
  },
  rightCol: {
    flex: 5,
    flexDirection: "column",
    gap: 15
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    borderBottom: "1 solid #f1f5f9",
    paddingBottom: 4
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingRight: 10
  },
  bullet: {
    width: 10,
    fontSize: 12,
    color: "#2563eb"
  },
  content: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#334155",
    flex: 1
  },
  rtbBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 15,
    border: "1 solid #e2e8f0",
    flex: 1,
    justifyContent: "center"
  },
  evidence: {
    fontSize: 12,
    color: "#1e293b",
    textAlign: "center",
    lineHeight: 1.6,
    fontWeight: 700
  },
  source: {
    fontSize: 8,
    color: "#64748b",
    textAlign: "right",
    marginTop: 10,
    textTransform: "uppercase"
  },
  metricBox: {
    backgroundColor: "#002d72",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  metricLabel: {
    fontSize: 8,
    color: "#93c5fd",
    fontWeight: 700,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  metricValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: 700,
    textAlign: "center"
  },
  footer: {
    marginTop: 20,
    borderTop: "1 solid #f1f5f9",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  footerText: {
    fontSize: 8,
    color: "#cbd5e1",
    textTransform: "uppercase"
  },
  pageNum: {
    fontSize: 9,
    color: "#002d72",
    fontWeight: 700
  }
});

export const SlidePDF: React.FC<SlidePDFProps> = ({ slides }) => (
  <Document>
    {slides.map((s, i) => (
      <Page
        key={i}
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{i + 1}. {s.title}</Text>
          <Text style={styles.headMessage}>{s.headMessage}</Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.leftCol}>
            <Text style={styles.sectionLabel}>주요 발견 및 분석</Text>
            {s.content.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.content}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rightCol}>
            <View style={styles.rtbBox}>
              <Text style={styles.sectionLabel}>근거 자료</Text>
              <Text style={styles.evidence}>"{s.rtb.evidence}"</Text>
              <Text style={styles.source}>{s.rtb.source}</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>핵심 성과 지표</Text>
              <Text style={styles.metricValue}>{s.rtb.metric}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AESA RADER STRATEGY REPORT</Text>
          <Text style={styles.pageNum}>{i + 3}</Text>
        </View>
      </Page>
    ))}
  </Document>
);
