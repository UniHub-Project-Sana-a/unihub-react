// src/hooks/useMotivationalQuote.ts

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, TrendingUp, BookOpen, Lightbulb, Rocket, Coffee, Target } from "lucide-react";

export interface Quote {
  text: string;
  source: string;
  icon: React.ReactNode;
}

const fallbackIcons: React.ReactNode[] = [
    <BookOpen className="w-10 h-10 mx-auto text-indigo-500 mb-3" />,
    <Lightbulb className="w-10 h-10 mx-auto text-amber-500 mb-3" />,
    <Sparkles className="w-10 h-10 mx-auto text-yellow-500 mb-3" />,
    <TrendingUp className="w-10 h-10 mx-auto text-blue-500 mb-3" />,
    <Rocket className="w-10 h-10 mx-auto text-purple-500 mb-3" />,
    <Coffee className="w-10 h-10 mx-auto text-orange-500 mb-3" />,
    <Target className="w-10 h-10 mx-auto text-red-500 mb-3" />,
];

// دالة لجلب عبارات متعددة
export const useMotivationalQuotes = (count: number) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // لا تعمل إذا كان العدد 0
    if (count === 0) {
        setIsLoading(false);
        return;
    }

    const fetchQuotes = async () => {
      setIsLoading(true);
      try {
        // إنشاء مصفوفة من طلبات الـ API
        const requests = Array.from({ length: count }, () => 
            axios.get('https://api.alquran.cloud/v1/ayah/random')
        );
        
        // تنفيذ كل الطلبات بالتوازي
        const responses = await Promise.all(requests);
        
        const newQuotes = responses.map((response, index) => {
            const ayahData = response.data.data;
            return {
              text: ayahData.text,
              source: `سورة ${ayahData.surah.name} - آية ${ayahData.numberInSurah}`,
              icon: fallbackIcons[index % fallbackIcons.length],
            };
        });

        // إزالة التكرار (في حال أعاد الـ API نفس الآية)
        const uniqueQuotes = Array.from(new Map(newQuotes.map(item => [item.text, item])).values());

        setQuotes(uniqueQuotes);

      } catch (error) {
          console.error("Failed to fetch motivational quotes:", error);
          // ✅ --- تعديل العبارة الاحتياطية هنا --- ✅
          const fallbackQuotes = Array.from({ length: count }, (_, index) => ({
              text: "النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم.",
              source: "جيمس كلير",
              icon: fallbackIcons[index % fallbackIcons.length],
          }));
          setQuotes(fallbackQuotes);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
  }, [count]); // الـ Hook يعمل مرة أخرى فقط إذا تغير عدد العبارات المطلوبة

  return { quotes, isLoading };
};