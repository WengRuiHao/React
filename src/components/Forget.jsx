import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import {  sendEmail } from '../service/Logintodo';
import { useAuth } from '../component/AuthToken';

// 定義 Login 組件，用於顯示登入表單
function Forget() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const{setToken,fetchWithAuth}=useAuth();
  const navigate = useNavigate();

  // 處理表單提交
  const handleSubmit = async (e) => {
      e.preventDefault();

      const user = {
          username: username,
          email: email,
      }
      console.log(user);
      

      try {
        const response = await sendEmail(user);
        // const response = await fetchWithAuth('http://localhost:8089/Login/Forget','POST', user);
        console.log(response);
          navigate('/login');

          // 清空錯誤訊息
          setErrorMessage("");
      } catch (error) {
        const errorMsg = error.message || '發生未知錯誤';
        setErrorMessage(errorMsg);
        console.log('網路錯誤:', errorMsg);
    }
  };

  return (
    
      <div className="bg-gray-300 p-10 rounded-lg shadow-lg w-80 max-w-sm flex-shrink-0 relative justify-end items-center">
      {/* 登入標題 */}
        <h2 className="text-2xl font-bold mb-6 text-center">忘記密碼</h2>
        {/* 錯誤訊息顯示 */}
        {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
        {/* 帳號輸入框 */}
        <input 
          type="text" 
          placeholder="帳號" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          className="w-full p-3 mb-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* 信箱輸入框 */}
        <input 
          type="email"
          placeholder="信箱" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-3 mb-6 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {/* 登入按鈕 */}
        <button 
          onClick={handleSubmit} 
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition duration-200"
        >
          送出
        </button>
      </div>
    
  );
};

export default Forget;