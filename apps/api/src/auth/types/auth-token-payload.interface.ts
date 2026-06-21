export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  nonce: string;
  type: "refresh";
}
