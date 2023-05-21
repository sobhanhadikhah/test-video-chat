import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import { BsTelephone } from "react-icons/bs";

export default function Lobby() {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");

    const socket = useSocket();
    const navigate = useNavigate();

    const handleSubmitForm = useCallback(
        (e) => {
            e.preventDefault();
            socket.emit("room:join", { email, room });
        },
        [email, room, socket]
    );

    const handleJoinRoom = useCallback(
        (data) => {
            const { room } = data;
            navigate(`/room/${room}`);
        },
        [navigate]
    );

    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return () => {
            socket.off("room:join", handleJoinRoom);
        };
    }, [socket, handleJoinRoom]);
    return (
        <div className=" h-screen text-black" >
            <h1 className="items-center" ><span className="bg-[#0282F9] text-white p-3 items-center flex flex-row gap-3 text-3xl " >Way2Connect  <span className="text-lg" >Video Chat</span> </span> </h1>
            <div className="grid place-content-center h-[50vh] text-center items-center justify-center" >

                <form onSubmit={handleSubmitForm} className=" bg-[#0282F9] p-3 rounded-md text-white flex flex-col justify-center items-center " >
                    <label htmlFor="email">Email ID</label>
                    <input
                        className="bg-transparent   px-2 w-[300px]  outline-none  border-b-2 "
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <br />
                    <label htmlFor="room">Room Number</label>
                    <input
                        className="bg-transparent w-full px-2  outline-none  border-b-2 "
                        type="text"
                        id="room"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                    />
                    <br />
                    <button className="absolute bottom-0 text-white  bg-[#0282F9] py-3 my-4 rounded-full px-3  " ><BsTelephone /></button>
                </form>
            </div>
        </div>
    )
}
