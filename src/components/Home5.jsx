import React, { useEffect, useState } from "react";
import ChatList from "../component/ChatList2";
import ChatWebsocket from "../component/ChatWebsocket2";
import Profile from "./Profile";
import AddChat from "../component/AddChat";
import { fetchAllChats,fetchMessages } from "../service/ChatList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../component/AuthToken";
import { useWebsocket } from "../component/AuthWebsocket";
import { addUserToChat } from "../service/ChatList";

function Home() {
  const { token, fetchWithAuth } = useAuth();
  const{sendWsMessage}=useWebsocket();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [image, setImage] = useState(null); // 儲存上傳後的圖片 URL

  const [UserData, setUserData] = useState({
    username: "",
    nickName: "",
    profileContent: "",
    email: "",
    gender: "",
    vactorPath:"",
  });

  const [messages, setMessages] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddChatModalOpen, setIsAddChatModalOpen] = useState(false);
  const [isEnteringRoom, setIsEnteringRoom] = useState(false);  // 新增狀態，判斷是否正在進入房間
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token]);

  useEffect(()=>{
    const loadUserDto = async () => {
      try {
        const fetchUserData=await fetchWithAuth('http://localhost:8089/home/profile','GET');
        // console.log(fetchUserData);
        setUserData(fetchUserData);
      } catch (error) {
        console.error("Failed to load chats:", error);
      }
    };
    loadUserDto();
  },[image]);

  // 獲取聊天室列表
  useEffect(() => {
    const loadChats = async () => {
      try {
        const fetchedChats = await fetchWithAuth('http://localhost:8089/home/chat/user','GET');
        setChats(fetchedChats);
      } catch (error) {
        console.error("Failed to load chats:", error);
      }
    };

    loadChats();
  }, [token, navigate]);

  const handleChatClick = async (chatId) => {
    console.log("Selected Chat ID:", chatId); // 確認 chatId
    // 只有當選擇新的聊天室時才會觸發退出房間
    if (selectedChat !== null && selectedChat !== chatId) {
      // 發送退出房間訊息
      const leftRoom = {
        head:{
          type:'leftRoom',
          timestamp:new Date(),
          condition:'1',
        },
        data:{
          username: UserData.username,
          roomId: selectedChat,
        }
      };
      sendWsMessage(leftRoom);
    }
    
    setSelectedChat(chatId);
    setIsEnteringRoom(true);  // 設定為進入房間的狀態
    try {
      //const fetchedMessages = await fetchMessages(chatId);
      const fetchedMessages = await fetchWithAuth(`http://localhost:8089/home/chat/${chatId}`,'GET');
      console.log("我的fetch拿到"+chatId)
      setMessages(fetchedMessages); // 更新消息
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }

  };

  useEffect(() => {
    // 如果是進入新房間，發送進入房間訊息
    if (isEnteringRoom && selectedChat !== null) {
      const addRoom = {
        head:{
          type:'addRoom',
          timestamp:new Date(),
          condition:'1',
        },
        data:{
          username: UserData.username,
          roomId: selectedChat,
        }
      };
      sendWsMessage(addRoom);
      setIsEnteringRoom(false);  // 進入房間後設定為false
    }
  }, [isEnteringRoom, selectedChat,  UserData.username]);


  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setImage(null);
    setIsModalOpen(false);
  };

  const handleOpenAddChatModal = () => {
    setIsAddChatModalOpen(true);
  };

  const handleCloseAddChatModal = () => {
    setIsAddChatModalOpen(false);
  };

  const handleChatCreated = (newChat) => {
    setChats((prevChats) => [...prevChats, newChat]);
    window.location.href = "http://localhost:3000/home";


  };



  return (
    <div className="flex flex-1 ">
      {/* 左側的聊天室列表區塊 */}
      
      
      {/* 圖片區塊 未啟用 */}
      {/* <div>
      <a href={UserData.vactorPath}><img src={UserData.vactorPath} alt="" style={{ width: '100px' }} /></a>
      </div> */}


      <div className="w-1/4 bg-gray-50 shadow-lg max-h-[80vh] p-4 border-r border-gray-200 h-full overflow-y-auto">
      <button
          className="btn btn-primary w-full mb-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          onClick={handleOpenAddChatModal}
        >
          新增聊天室
        </button>

        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onChatClick={handleChatClick}
        />
      </div>

      {/* 中間的聊天內容區塊 */}
      <div className="flex-1 bg-white shadow-lg p-6 mx-4 rounded-lg ">
      <div className="bg-gray-100 shadow-md p-6 rounded-lg h-full">
          {selectedChat ? (
            <ChatWebsocket chatId={selectedChat} chatname={chats.find(chat => chat.chatId === selectedChat)?.chatname || "聊天室"} messages={messages} />
        ) : (
            <p className="text-center text-gray-500">請選擇一個聊天室開始聊天</p>
          )}
        </div>
      </div>

      {/* 右側的聊天對象資訊區塊 */}
      <div className="w-1/4 bg-white shadow-lg p-4 ">
      {selectedChat ? (
          <Profile
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            UserData={UserData}
            setUserData={setUserData}
            image={image}
            setImage={setImage}
          />
        ) : (
          <p className="text-center text-gray-500">
            請選擇一個聊天室以查看對象資訊
          </p>
        )}
        <button
          className="btn btn-primary btn-lg mt-4 w-full"
          onClick={handleOpenModal}
        >
          修改個人資料
        </button>
      </div>

      {/* 新增聊天室模態框 */}
      <AddChat
        isOpen={isAddChatModalOpen}
        onClose={handleCloseAddChatModal}
        onChatCreated={handleChatCreated}
        
      />
    </div>
  );
}

export default Home;
