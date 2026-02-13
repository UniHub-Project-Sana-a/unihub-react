import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// ✅ تسجيل الخط العربي (رابط CDN سريع ومستقر)
Font.register({
  family: 'Cairo',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/cairo@5.0.3/files/cairo-arabic-400-normal.woff'
});

// ✅ تعريف الأنماط
const styles = StyleSheet.create({
  page: { 
    flexDirection: 'column', 
    padding: 30, 
    fontFamily: 'Cairo', // استخدام الخط العربي
    fontSize: 12
  },
  header: { 
    marginBottom: 20, 
    borderBottomWidth: 2, 
    borderBottomColor: '#111', 
    paddingBottom: 10,
    alignItems: 'center'
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 5
  },
  subtitle: { 
    fontSize: 14, 
    color: '#555' 
  },
  section: { 
    marginVertical: 10 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    backgroundColor: '#f0f0f0', 
    padding: 5,
    textAlign: 'right'
  },
  // الجدول
  table: { 
    display: "flex", 
    width: "auto", 
    borderStyle: "solid", 
    borderWidth: 1, 
    borderRightWidth: 0, 
    borderBottomWidth: 0 
  }, 
  tableRow: { 
    margin: "auto", 
    flexDirection: "row-reverse" // لكي يبدأ من اليمين
  }, 
  tableCol: { 
    width: "16%", // توزيع العرض (6 أعمدة تقريباً)
    borderStyle: "solid", 
    borderWidth: 1, 
    borderLeftWidth: 0, 
    borderTopWidth: 0 
  }, 
  tableColWide: {
    width: "25%",
    borderStyle: "solid", 
    borderWidth: 1, 
    borderLeftWidth: 0, 
    borderTopWidth: 0 
  },
  tableCell: { 
    margin: 5, 
    fontSize: 10,
    textAlign: 'right'
  },
  tableHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  // بطاقات الملخص
  summaryBox: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fafafa'
  },
  summaryItem: {
    alignItems: 'center',
    width: '30%'
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222'
  }
});

// تعريف البيانات
interface ReportData {
    summary: { total_submissions: number; overall_score: number; overall_percentage: number; target_percentage: number; };
    lecturers_list: { name: string; course: string; eval_count: number; score: number; percentage: number; rating_label: string; }[];
    campaignName: string;
}

export const QaReportDocument = ({ data }: { data: ReportData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* الترويسة */}
      <View style={styles.header}>
        <Text style={styles.title}>تقرير نتائج تقييم الأداء</Text>
        <Text style={styles.subtitle}>{data.campaignName}</Text>
        <Text style={{ fontSize: 10, marginTop: 5, color: '#888' }}>
          تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}
        </Text>
      </View>

      {/* ملخص الأرقام */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>إجمالي الاستجابات</Text>
          <Text style={styles.summaryValue}>{data.summary.total_submissions}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>المتوسط العام</Text>
          <Text style={styles.summaryValue}>{data.summary.overall_score} / 3</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>النسبة المئوية</Text>
          <Text style={styles.summaryValue}>{data.summary.overall_percentage}%</Text>
        </View>
      </View>

      {/* جدول التفاصيل */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تفاصيل الأداء للمقررات</Text>
        
        <View style={styles.table}>
          {/* رأس الجدول */}
          <View style={[styles.tableRow, { backgroundColor: '#eee' }]}>
            <View style={styles.tableColWide}><Text style={styles.tableHeader}>اسم المحاضر</Text></View>
            <View style={styles.tableColWide}><Text style={styles.tableHeader}>المقرر</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableHeader}>العدد</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableHeader}>المتوسط</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableHeader}>النسبة</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableHeader}>التقدير</Text></View>
          </View>

          {/* صفوف الجدول */}
          {data.lecturers_list.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableColWide}><Text style={styles.tableCell}>{item.name}</Text></View>
              <View style={styles.tableColWide}><Text style={styles.tableCell}>{item.course}</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { textAlign: 'center' }]}>{item.eval_count}</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { textAlign: 'center', fontWeight: 'bold' }]}>{item.score}</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { textAlign: 'center' }]}>{item.percentage}%</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { textAlign: 'center' }]}>{item.rating_label}</Text></View>
            </View>
          ))}
        </View>
      </View>

      {/* التذييل */}
      <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }}>
        <Text style={{ fontSize: 9, color: '#aaa' }}>
          نظام UniHub لضمان الجودة والاعتماد الأكاديمي
        </Text>
      </View>

    </Page>
  </Document>
);