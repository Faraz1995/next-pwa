import { useState } from 'react'
import axios from 'axios'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'

export default function Home() {
  const [status, setStatus] = useState('start')
  let crypto
  let subtle
  if (typeof window !== 'undefined') {
    crypto = window && (window.crypto || window.msCrypto) // for IE 11 compatibility
    subtle = crypto.subtle
  }

  const bufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
  const base64ToBuffer = (base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

  const locallyGenerate = () => {
    // sample arguments for registration
    const createCredentialDefaultArgs = {
      publicKey: {
        // Relying Party (a.k.a. - Service):
        rp: {
          name: 'Acme'
        },

        // User:
        user: {
          id: new Uint8Array(16),
          name: 'faraz@example.com',
          displayName: 'faraz'
        },

        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7
          }
        ],

        attestation: 'direct',

        timeout: 60000,

        challenge: new Uint8Array([
          // must be a cryptographically random number sent from a server
          0x8c, 0x0a, 0x26, 0xff, 0x22, 0x91, 0xc1, 0xe9, 0xb9, 0x4e, 0x2e, 0x17, 0x1a,
          0x98, 0x6a, 0x73, 0x71, 0x9d, 0x43, 0x48, 0xd5, 0xa7, 0x6a, 0x15, 0x7e, 0x38,
          0x94, 0x52, 0x77, 0x97, 0x0f, 0xef
        ]).buffer
      }
    }

    // sample arguments for login
    const getCredentialDefaultArgs = {
      publicKey: {
        timeout: 60000,
        // allowCredentials: [newCredential] // see below
        challenge: new Uint8Array([
          // must be a cryptographically random number sent from a server
          0x79, 0x50, 0x68, 0x71, 0xda, 0xee, 0xee, 0xb9, 0x94, 0xc3, 0xc2, 0x15, 0x67,
          0x65, 0x26, 0x22, 0xe3, 0xf3, 0xab, 0x3b, 0x78, 0x2e, 0xd5, 0x6f, 0x81, 0x26,
          0xe2, 0xa6, 0x01, 0x7d, 0x74, 0x50
        ]).buffer
      }
    }

    // register / create a new credential
    navigator.credentials.create(createCredentialDefaultArgs).then((cred) => {
      console.log('NEW CREDENTIAL', cred)

      // normally the credential IDs available for an account would come from a server
      // but we can just copy them from above…
      const idList = [
        {
          id: cred.rawId,
          transports: ['usb', 'nfc', 'ble'],
          type: 'public-key'
        }
      ]
      // getPublicKey(cred.rawId)

      console.log(idList)
      getCredentialDefaultArgs.publicKey.allowCredentials = idList
      return navigator.credentials.get(getCredentialDefaultArgs)
    })
    // .then((assertion) => {
    //   console.log('ASSERTION', assertion)
    // })
    // .catch((err) => {
    //   console.log('ERROR', err)
    // })
  }

  const register = async () => {
    console.log('register')
    const res = await (await axios.get('api/v1/pwa/register-option')).data
    const danny = { ...res.registrationOptions }
    const defaultOptions = { ...res.createCredentialDefaultArgs }
    // console.log('create options************', createOptions)
    defaultOptions.publicKey.challenge = new Uint8Array(
      defaultOptions.publicKey.challenge
    ).buffer
    defaultOptions.publicKey.user.id = new Uint8Array(
      defaultOptions.publicKey.user.id
    ).buffer
    console.log('default options***********', defaultOptions)
    danny.challenge = new Uint8Array(danny.challenge.data)
    danny.user.id = new Uint8Array(danny.user.id.data)
    danny.user.name = 'pwa@example.com'
    danny.user.displayName = 'What PWA Can Do Today'
    console.log('danny************', danny)

    console.log(danny)
    try {
      setStatus('before create')
      const credential = await navigator.credentials.create({ publicKey: danny })
      setStatus('credential***' + JSON.stringify(credential))
      const credentialId = bufferToBase64(credential.rawId)
      setStatus('id***' + JSON.stringify(credentialId))
      console.log('id**************', credentialId)
      localStorage.setItem('credential', JSON.stringify({ credentialId }))
      const registerFingerData = {
        rawId: credentialId,
        response: {
          attestationObject: bufferToBase64(credential.response.attestationObject),
          clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
          id: credential.id,
          type: credential.type
        }
      }
      try {
        setStatus('register')
        // const registerRes = await axios({
        //   method: 'post',
        //   url: 'api/v1/pwa/register',
        //   headers: {},
        //   data: JSON.stringify({ credential: registerFingerData }) // This is the body part
        // })

        const res = await fetch(`api/v1/pwa/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ credential: registerFingerData }),
          credentials: 'include'
        })
        console.log(res)
        setStatus('registered')
      } catch (error) {
        setStatus(JSON.stringify(error))
        console.log(error)
      }
    } catch (error) {
      setStatus('error' + JSON.stringify(error))
      console.error('registration failed', error)
    }
  }

  function arrayBufferToPem(arrayBuffer, label) {
    const base64 = arrayBufferToBase64(arrayBuffer)
    return (
      `-----BEGIN ${label}-----\n` +
      chunkString(base64, 64) +
      `\n-----END ${label}-----\n`
    )
  }

  function chunkString(str, length) {
    return str.match(new RegExp(`.{1,${length}}`, 'g')).join('\n')
  }

  function arrayBufferToBase64(arrayBuffer) {
    let binary = ''
    const bytes = new Uint8Array(arrayBuffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  const getPublicKey = async (rawId) => {
    const publicKeyArrayBuffer = await subtle.exportKey('spki', rawId)
    const publicKeyPem = arrayBufferToPem(publicKeyArrayBuffer, 'PUBLIC KEY')
    console.log(publicKeyPem)
  }
  const validate = async () => {
    console.log('validate')
    const validationOption = await axios({
      method: 'GET',
      url: 'api/v1/pwa/validate-option'
    })
    const authnOptions = { ...validationOption.data.authnOptions }
    console.log('v oprions**************', validationOption)
    const { credentialId } = JSON.parse(localStorage.getItem('credential'))
    console.log('id***********', credentialId)
    authnOptions.challenge = new Uint8Array(authnOptions.challenge.data)
    authnOptions.allowCredentials = [
      {
        id: base64ToBuffer(credentialId),
        type: 'public-key',
        transports: ['internal']
      }
    ]
    console.log('final authn options***********', authnOptions)
    const credential = await navigator.credentials.get({
      publicKey: authnOptions
    })
    const data = {
      rawId: bufferToBase64(credential.rawId),
      response: {
        authenticatorData: bufferToBase64(credential.response.authenticatorData),
        signature: bufferToBase64(credential.response.signature),
        userHandle: bufferToBase64(credential.response.userHandle),
        clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        id: credential.id,
        type: credential.type
      }
    }
    setStatus('before verify call')
try {
  const verifyRes = await axios({
    method: 'post',
    url: 'api/v1/pwa/verify-finger',
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({ credential: data }), // This is the body part
    withCredentials: true
  })
  setStatus(verifyRes.data.result.msg)
} catch (error) {
  setStatus('error in axios')
}
    

    // fetch(`api/v1/pwa/verify-finger`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ credential: data }),
    //   credentials: 'include'
    // })
    //   .then((res) => {
    //     setStatus('then***********' + JSON.parse(res).msg)
    //   })
    //   .catch((e) => {
    //     setStatus('error in fetch')
    //   })
  }
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name='description' content='Generated by create next app' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <div>
            <p>{status}</p>
          </div>
        </div>
        <div className={styles.btnBox}>
          <button onClick={register}>register finger</button>
          <button onClick={validate}>check finger</button>
        </div>
      </main>
    </>
  )
}
