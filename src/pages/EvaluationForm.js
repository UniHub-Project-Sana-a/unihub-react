import React, { useState } from 'react';

const EvaluationForm = () => {
  // الحالة لتخزين بيانات النموذج والتقييمات
  const [formData, setFormData] = useState({
    instructorName: '',
    degree: '',
    faculty: '',
    specialization: '',
    courseName: '',
    courseType: 'theory', // نظري أو عملي
    evaluations: {} // لتخزين قيم الفقرات (1, 2, 3)
  });

  // قائمة الفقرات بناءً على الملف المرفق
  const evaluationItems = [
    { id: 1, text: "يعزز الهوية الإيمانية والانتماء الوطني لطلبته", category: "الشخصية" },
    { id: 2, text: "يلتزم بأخلاقيات المهنة", category: "الشخصية" },
    { id: 3, text: "متمكن من مادته العلمية", category: "الشخصية" },
    { id: 4, text: "يلتزم بمواعيد وتوقيت المحاضرة", category: "الشخصية" },
    { id: 5, text: "قادراً على إدارة القاعة الدراسية", category: "الشخصية" },
    { id: 6, text: "يعزز الإنجازات الجيدة لطلبته", category: "الشخصية" },
    { id: 7, text: "يعرض الخطة الدراسية للمقرر في أول محاضرة بحسب التوصيف المعتمد", category: "تنفيذ المحاضرة" },
    { id: 8, text: "يستخدم الوسائل التعليمية المناسبة", category: "تنفيذ المحاضرة" },
    { id: 9, text: "يربط موضوع المحاضرة مع سابقتها", category: "تنفيذ المحاضرة" },
    { id: 10, text: "ينوع في أساليب عرض المادة العلمية", category: "تنفيذ المحاضرة" },
    { id: 11, text: "يمنح طلبته فرص متساوية في المشاركة اثناء المحاضرة", category: "تنفيذ المحاضرة" },
    { id: 12, text: "ينوع في تصميم الاختبارات (مقالية، موضوعية، أدائية)", category: "التقييم" },
    { id: 13, text: "يقيم تكليفات وأنشطة طلبته الفردية والجماعية الصفية واللاصفية", category: "التقييم" },
    { id: 14, text: "يستفيد من نتائج الاختبارات لتحسين مستوى طلبته", category: "التقييم" },
  ];

  const handleRatingChange = (itemId, rating) => {
    setFormData({
      ...formData,
      evaluations: { ...formData.evaluations, [itemId]: rating }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("بيانات التقييم المرسلة:", formData);
    alert("شكراً لتعاونك، تم إرسال التقييم بنجاح.");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg dir-rtl" dir="rtl">
      {/* الترويسة */}
      <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-blue-900">جامعة صنعاء</h1>
        <h2 className="text-xl">مركز التطوير وضمان الجودة</h2>
        <h3 className="bg-blue-100 p-2 mt-3 font-semibold rounded">مقياس تقييم عضو هيئة التدريس من قبل الطالب</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* القسم الأول: بيانات المدرس والمقرر */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded">
          <input type="text" placeholder="اسم عضو هيئة التدريس" className="p-2 border rounded" required />
          <input type="text" placeholder="الدرجة العلمية" className="p-2 border rounded" />
          <input type="text" placeholder="الكلية" className="p-2 border rounded" />
          <input type="text" placeholder="التخصص" className="p-2 border rounded" />
          <input type="text" placeholder="اسم المقرر الدراسي" className="p-2 border rounded col-span-1 md:col-span-2" />
        </div>

        {/* القسم الثاني: جدول التقييم */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="border p-2 w-10">م</th>
                <th className="border p-2">فقرات التقييم</th>
                <th className="border p-2 w-16">3</th>
                <th className="border p-2 w-16">2</th>
                <th className="border p-2 w-16">1</th>
              </tr>
            </thead>
            <tbody>
              {evaluationItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{item.id}</td>
                  <td className="border p-2">{item.text}</td>
                  {[3, 2, 1].map((rate) => (
                    <td key={rate} className="border p-2 text-center">
                      <input
                        type="radio"
                        name={`rating-${item.id}`}
                        required
                        onChange={() => handleRatingChange(item.id, rate)}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* تعليمات المقياس */}
        <div className="mt-6 text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
          <p><strong>ملاحظة:</strong> (3) تتفق تماماً، (2) تتفق إلى حد ما، (1) لا تتفق تماماً.</p>
          <p>إجاباتكم سرية ولن يطلع عليها أحد، وهي تهدف لتطوير العملية التعليمية.</p>
        </div>

        {/* زر الإرسال */}
        <button type="submit" className="mt-8 w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-300">
          إرسال التقييم النهائي
        </button>
      </form>
      
      <footer className="mt-10 pt-4 border-t text-center text-xs text-gray-400">
        جامعة صنعاء - مركز التطوير وضمان الجودة - 2026
      </footer>
    </div>
  );
};

export default EvaluationForm;