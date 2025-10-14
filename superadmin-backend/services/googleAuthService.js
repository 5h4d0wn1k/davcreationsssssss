import { OAuth2Client } from "google-auth-library";

const clientId =
  "976564230667-jhnmhnlkqpn1aeqepn3qbt1o0o6ou9rn.apps.googleusercontent.com";

const client = new OAuth2Client({
  clientId,
});

export const verifyToken = async (idToken) => {
  const loginTicket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const userData = loginTicket.getPayload();
  return userData;
};
