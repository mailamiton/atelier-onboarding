import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
}

const userPool = new CognitoUserPool(poolData)

export interface LoginCredentials {
  username: string
  password: string
}

export interface SignupData extends LoginCredentials {
  email: string
  name: string
}

export const auth = {
  signup: async (data: SignupData): Promise<CognitoUser> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: data.email }),
        new CognitoUserAttribute({ Name: 'name', Value: data.name }),
      ]

      userPool.signUp(
        data.username,
        data.password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            reject(err)
            return
          }
          resolve(result!.user)
        }
      )
    })
  },

  login: async (credentials: LoginCredentials): Promise<string> => {
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: credentials.username,
        Password: credentials.password,
      }
      const authenticationDetails = new AuthenticationDetails(authenticationData)

      const userData = {
        Username: credentials.username,
        Pool: userPool,
      }
      const cognitoUser = new CognitoUser(userData)

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const accessToken = result.getAccessToken().getJwtToken()
          localStorage.setItem('accessToken', accessToken)
          resolve(accessToken)
        },
        onFailure: (err) => {
          reject(err)
        },
      })
    })
  },

  logout: () => {
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
    localStorage.removeItem('accessToken')
  },

  getCurrentUser: (): CognitoUser | null => {
    return userPool.getCurrentUser()
  },

  getSession: async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser()
      if (!cognitoUser) {
        reject(new Error('No user found'))
        return
      }

      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          reject(err)
          return
        }
        resolve(session)
      })
    })
  },
}
