import argparse
import sys
import requests

DEFAULT_BASE_URL = 'http://127.0.0.1:8000'


def do_login(args: argparse.Namespace) -> int:
    url = f"{args.base_url.rstrip('/')}/auth/login"
    try:
        response = requests.post(
            url,
            data={'username': args.email, 'password': args.password},
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=20,
        )
    except requests.RequestException as exc:
        print(f"Request failed: {exc}")
        return 1

    if response.status_code >= 400:
        try:
            payload = response.json()
        except ValueError:
            payload = {'detail': response.text}
        print(f"Login failed ({response.status_code}): {payload.get('detail', payload)}")
        return 1

    payload = response.json()
    print('Login successful')
    print(f"access_token: {payload.get('access_token', '')}")
    print(f"refresh_token: {payload.get('refresh_token', '')}")
    print(f"token_type: {payload.get('token_type', 'bearer')}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description='Fitness API CLI')
    parser.add_argument('--base-url', default=DEFAULT_BASE_URL, help='API base URL (default: http://127.0.0.1:8000)')

    subparsers = parser.add_subparsers(dest='command', required=True)

    login_parser = subparsers.add_parser('login', help='Login with email and password')
    login_parser.add_argument('--email', required=True, help='User email')
    login_parser.add_argument('--password', required=True, help='User password')
    login_parser.set_defaults(func=do_login)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
