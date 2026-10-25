// Net_Disconnect.cpp

#include "stdafx.h"
#include "globals.h"
#include "functions.h"
#include "Net/MuEmu.h"
#include "Net/Net.h"
#include "Render/Camera.h"

// ── Net_Disconnect @ 0x0043dc90 ──────────────────────────────────────────────
// Closes the game socket and resets connection state.
void Net_DropOutboundQueue(void)
{
    SocketClientSendBufferLength = 0;
    *(int*)(SocketClient + 0x200c) = 0;
}

void Net_DropInboundQueue(void)
{
    // 300 slots × 0x2008 starting at +0x401c. The partial recv at +0x4010
    // would otherwise prefix the next connection's first bytes.
    memset(SocketClient + 0x401c, 0, 300u * 0x2008u);
    *(int*)(SocketClient + 0x4010) = 0;
    *(int*)(SocketClient + 0x4014) = 0;
    *(int*)(SocketClient + 0x4018) = 0;
}

int __cdecl Net_Disconnect(int ctx) {
    (void)ctx;
    Net_DropOutboundQueue();
    if (SocketClientSocket != (DWORD)INVALID_SOCKET) {
        closesocket((SOCKET)SocketClientSocket);
        SocketClientSocket = (DWORD)INVALID_SOCKET;
    }
    return 0;
}

