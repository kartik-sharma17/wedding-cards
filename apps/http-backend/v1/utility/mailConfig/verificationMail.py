import resend
from jinja2 import Template
from config import settings
from fastapi import HTTPException
from ..logger import log

resend.api_key = settings.RESEND_API_KEY

async def SendVerificationEmail(email: str, name: str, token: str):
    try:
        verify_link = f"{settings.BASE_URL}/verify-account/{token}"

        with open("v1/utility/mailConfig/template/verifyMailTemplate.html") as f:
            html_template = Template(f.read())
            html_content = html_template.render(name=name, verify_link=verify_link)

        resend.Emails.send({
            "from": f"{settings.MAIL_FROM_NAME} <vault@clarixai.in>",
            "to": [email],
            "subject": "Verify Your Vault Account",
            "html": html_content,
        })

        return True
    except Exception as e:
        log.info(f"somethings went wrong whiling sending email {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "message":"Something went wrong while sending verification mail, please try again later",
                "status":False,
            }
        )


