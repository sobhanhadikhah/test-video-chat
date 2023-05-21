import { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import { AiFillSound } from "react-icons/ai";

export default function Room() {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [mutedVoice, setMutedVoice] = useState(false);

    const handleUserJoined = useCallback(({ email, id }) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleIncommingCall = useCallback(
        async ({ from, offer }) => {
            setRemoteSocketId(from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);
            console.log(`Incoming Call`, from, offer);
            const ans = await peer.getAnswer(offer);
            socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
    );

    const sendStreams = useCallback(() => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }
    }, [myStream]);

    const handleCallAccepted = useCallback(
        ({ ans }) => {
            peer.setLocalDescription(ans);
            console.log("Call Accepted!");
            sendStreams();
        },
        [sendStreams]
    );

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncomming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
        },
        [socket]
    );

    const handleNegoNeedFinal = useCallback(async ({ ans }) => {
        await peer.setLocalDescription(ans);
    }, []);

    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incomming:call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncomming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incomming:call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncomming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        };
    }, [
        socket,
        handleUserJoined,
        handleIncommingCall,
        handleCallAccepted,
        handleNegoNeedIncomming,
        handleNegoNeedFinal,
    ]);
    return (
        <div   >
            <h1 className="items-center" ><span className="bg-[#0282F9] text-white p-3 items-center flex flex-row gap-3 text-3xl " >Way2Connect  <span className="text-lg" >Video Chat</span> </span> </h1>
            <div className="flex flex-col " >
                <h4 className="text-center text-3xl py-3  " >{remoteSocketId ? <span className="text-green-500" >Connected</span> : <span className="text-red-600" >No one in room</span>}</h4>
                {remoteSocketId && <button className="bg-green-500  text-white p-3 rounded-md" onClick={handleCallUser}>Accept</button>}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center pt-8  " >

                {myStream && (
                    <div className="flex flex-col justify-center items-center player-wrapper  " >
                        <ReactPlayer
                            className="react-player"
                            playing
                            muted
                            url={myStream}
                            volume={1}
                            controls
                        />
                        <h1>My Camera</h1>
                    </div>
                )}
                {remoteStream && (
                    <div className="flex flex-col justify-center items-center ">
                        <div className="flex flex-col  player-wrapper  justify-center items-center" >


                            <ReactPlayer
                                className="react-player"
                                playing
                                volume={1}
                                muted={mutedVoice}
                                url={remoteStream}
                            />

                            <AiFillSound onClick={() => setMutedVoice(!mutedVoice)} className={` cursor-pointer ${mutedVoice ? "text-red-500" : "text-green-400"}   `} size={30} />
                        </div>
                        <h1>User camera</h1>
                    </div>
                )}
            </div>
            <div className="absolute bottom-0  left-0 right-0 " >
                {myStream && <button className="bg-slate-200 p-3" onClick={sendStreams}>Show All Camera</button>}
            </div>
        </div>
    )
}
