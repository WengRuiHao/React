import React, { useState, useEffect, useRef } from "react";
import { getAllTodos, getProfileTodo, getChatTodo } from "../service/ChatHistory";
import { useAuth } from "./AuthToken";
import { useWebsocket } from "./AuthWebsocket";

function ChatWebsocket({ chatname, chatId }) {
  const { token, fetchWithAuth} = useAuth();
  const {sendWsMessage,wsMessages}=useWebsocket();
  const [messages, setMessages] = useState([]); // 訊息列表
  const [messageInput, setMessageInput] = useState(""); // 輸入框中的訊息

  const [sendUser, setSendUser] = useState({
    username: "",
    nickname: "",
    gender: "",
    vactorPath:""
  }); // 用戶物件

  const [receiveChat, setReceiveChat] = useState({
    chatId: "",
    chatname: "",
    createAt: "",
    creator: sendUser
  })//聊天室物件

  const messageEndRef = useRef(null); // 用於滾動到最新消息的引用


  if (!token) {
    window.location.href = "/login"; // 跳轉到登錄頁
  }

  // 初始化用戶資料、聊天室資料和歷史訊息
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await fetchWithAuth('http://localhost:8089/home/chat', 'GET');
        setSendUser(profile);

        const chatProfile = await fetchWithAuth(`http://localhost:8089/home/chat/${chatId}/profile`, 'GET');
        setReceiveChat(chatProfile);


        const chatHistory = await fetchWithAuth(`http://localhost:8089/home/chat/${chatId}`, 'GET');
        setMessages(chatHistory);
      } catch (error) {
        console.error("資料獲取失敗:", error);
      }
    };

    fetchData();
  }, [chatId]);

  

  const sendMessage = () => {
    if (!sendUser) {
      alert("用戶資料尚未載入，請稍後再試！");
      return;
    }


    if (messageInput.trim() !== "" ) {
      console.log("Message sent:", messageInput); // 模擬發送訊息

      const messageDto = {
        sendUser: sendUser,
        receiveChat: receiveChat,
        message: messageInput.trim(),
      };
      
      const sendMessage={
        head:{
          type:'sendMessage',
          timestamp:new Date(),
          condition:'1',
        },
        data:messageDto,
      }
      sendWsMessage(sendMessage);
      setMessageInput("");
    } else {
      alert("請輸入有效的訊息！");
    }
  };
  useEffect(() => {
    // 每當 wsMessages 更新時，將新訊息添加到本地 messages 狀態
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];
      setMessages((prevMessages) => [...prevMessages, latestMessage]);
    }
  }, [wsMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 h-full">
        {/* 動態顯示 chatname */}
        <h2 className="text-xl font-bold mb-4">{chatname || "聊天室"}</h2>

        <div className="h-3/4 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col max-h-[60vh]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-2 rounded mb-2 shadow ${message.sendUser?.username === sendUser.username
                ? "bg-blue-200 text-right ml-auto"
                : "bg-gray-200 text-left mr-auto"
                
                }`}
              style={{
                maxWidth: "80%",
                display:"flex"
              }}
            >
              {/* 頭像 */}
            <a
              href={message.sendUser?.username === sendUser.vactorPath ? "我" : message.sendUser?.vactorPath || "#"}
              className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
            >
              <img
                src={message.sendUser?.username === sendUser.vactorPath ? "我" : message.sendUser?.vactorPath || "default-avatar.png"}
                alt="頭像"
                className="w-full h-full object-cover"
                style={{ width: '100px' }}
              />
            </a>
              {/* <a href={sendUser.vactorPath}><img src={sendUser.vactorPath} alt="" style={{ width: '100px' }}  /></a> */}
              <strong>
                {message.sendUser?.username === sendUser.username ? "我" : message.sendUser?.username}
              </strong>
              : {message.message}
            </div>
          ))}
          <div ref={messageEndRef}></div>
        </div>



        <div className="flex mt-4">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="請輸入訊息..."
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={sendMessage}
          >
            發送
          </button>
        </div>
      </div>
    </div>
  );

}

export default ChatWebsocket;