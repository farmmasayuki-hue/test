require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// 💡 Render（本番）とPC（テスト）のどちらでも動く魔法のポート設定！
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// 🗝️ 通行証（APIキー）のセット
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🧠 AI分析の受付窓口（名前のズレを防ぐため、2つの扉を用意しました）
app.post(['/api/analyze', '/analyze'], async (req, res) => {
  try {
    const { theme, mode } = req.body;
    console.log(`リクエスト受信: モード=[${mode}], テーマ=[${theme}]`);

    // もしテーマが空っぽだったら優しくエラーを返す
    if (!theme) {
      return res.status(400).json({ success: false, error: "テーマが入力されていません。" });
    }

    let systemInstruction = "";
    let finalPrompt = "";

    // モードごとのプロンプト（AIへの指示）
    if (mode === 'capital') {
      systemInstruction = `あなたは金融資本史と地政学に精通したトップアナリストです。`;
      finalPrompt = `以下のテーマについて、巨大資本の視点から分析してください。\nテーマ：${theme}`;
    } else {
      systemInstruction = `あなたは金融史とマクロ経済政策に精通したトップクラスの経済アナリストです。`;
      finalPrompt = `以下のテーマについて、政府と中央銀行の対立構造に焦点を当てて分析してください。\nテーマ：${theme}`;
    }

    // いざ、Gemini APIへ通信！
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: { temperature: 0.4 }
    });

    // 画面へ分析結果を返す
    const responseText = result.response.text();
    res.json({ success: true, text: responseText });

  } catch (error) {
    console.error("AI分析エラー:", error);
    res.status(500).json({ success: false, error: "分析に失敗しました。通信状況を確認してください。" });
  }
});

// 🚀 待機命令
app.listen(port, () => {
  console.log(`🚀 最終完璧版サーバー起動: http://localhost:${port}`);
});