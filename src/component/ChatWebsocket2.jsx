import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthToken";
import { useWebsocket } from "./AuthWebsocket";
import { leaveChat, addUserToChat } from "../service/ChatList";

function ChatWebsocket({ chatname, chatId }) {
  const { token, fetchWithAuth } = useAuth();
  const { sendWsMessage, wsMessages} = useWebsocket();
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
    creator: {}
  }); //聊天室物件

  const messageEndRef = useRef(null); // 用於滾動到最新消息的引用

  // 新增兩個狀態用於控制添加人員 Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [usernameToAdd, setUsernameToAdd] = useState("");

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
  }, [chatId, fetchWithAuth]);


  const handleLeaveChat = async () => {

    const leftRoom = {
      head:{
        type:'leftRoom',
        timestamp:new Date(),
        condition:'1',
      },
      data:{
        username: sendUser.username, 
        roomId: receiveChat.chatId
      }
    };
    console.log(leftRoom);
    sendWsMessage(leftRoom);

    try {
      await leaveChat(receiveChat.chatId, sendUser.username);
      // 離開聊天室後的行為 (此處範例為導回首頁，可自行調整)
      window.location.href = "http://localhost:3000/home";
    } catch (error) {
      console.error("無法離開聊天室:", error);
    }
  };

  const handleAddUserButtonClick = () => {
    const addRoom = {
      head:{
        type:'addRoom',
        timestamp:new Date(),
        condition:'1',
      },
      data:{
        username: sendUser.username, 
        roomId: receiveChat.chatId
      }
    };
    sendWsMessage(addRoom);
    // 打開添加人員的對話框
    setIsAddUserModalOpen(true);
  };

  const handleAddUserSubmit = async (e) => {

    

    e.preventDefault();
    if (!usernameToAdd.trim()) {
      alert("請輸入要添加的使用者名稱");
      return;
    }
    try {
      await addUserToChat(receiveChat.chatId, usernameToAdd.trim());
      alert("成功添加使用者：" + usernameToAdd);
      setUsernameToAdd("");
      setIsAddUserModalOpen(false);
    } catch (error) {
      console.error("無法將使用者加入聊天室:", error);
      alert("添加使用者失敗！");
    }
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
    setUsernameToAdd("");
  };

  const sendMessage = () => {
    if (!sendUser) {
      alert("用戶資料尚未載入，請稍後再試！");
      return;
    }

    if (messageInput.trim() !== "") {
      const messageDto = {
        sendUser: sendUser,
        receiveChat: receiveChat,
        message: messageInput.trim(),
      };
      
      const sendMessage = {
        head: {
          type:'sendMessage',
          timestamp:new Date(),
          condition:'1',
        },
        data: messageDto,
      };
      sendWsMessage(sendMessage);
      setMessageInput("");
    } else {
      alert("請輸入有效的訊息！");
    }
  };

  useEffect(() => {
    // 每當 wsMessages 更新時，將新訊息添加到本地 messages 狀態
    if (wsMessages.length > 0&& wsMessages.map(item=>item.receiveChat.chatId===chatId) ) {
      // console.log(wsMessages.map(item=>item.receiveChat.chatId));
      
      const latestMessage = wsMessages[wsMessages.length - 1];
      setMessages((prevMessages) => [...prevMessages, latestMessage]);
    }
  }, [wsMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 relative">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 h-full">
        {/* 動態顯示 chatname */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{chatname || "聊天室"}</h2>
          <div className="flex space-x-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              onClick={handleAddUserButtonClick}
            >
              添加人員
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              onClick={handleLeaveChat}
            >
              退出聊天室
            </button>
          </div>
        </div>
        
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
                display: "flex",
                alignItems: "center"
              }}
            >
              <a
                href={message.sendUser?.vactorPath || "#"}
                className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mr-2"
              >
                <img
                  src={message.sendUser?.vactorPath || "default-avatar.png"}
                  alt="頭像"
                  className="w-full h-full object-cover"
                />
              </a>
              <div>
                <strong>
                  {message.sendUser?.username === sendUser.username ? "我" : message.sendUser?.username}
                </strong>
                : {message.message}
              </div>
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

      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-1/3 p-6 relative">
            <h2 className="text-xl font-bold mb-4 text-center">添加使用者到聊天室</h2>
            <form onSubmit={handleAddUserSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  使用者名稱
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={usernameToAdd}
                  onChange={(e) => setUsernameToAdd(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddUserModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  確認添加
                </button>
              </div>
            </form>
            <button
              type="button"
              onClick={handleCloseAddUserModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              &#x2715;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWebsocket;
