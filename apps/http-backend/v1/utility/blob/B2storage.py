import asyncio
import base64

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from config import settings
from v1.utility import log


def get_storage_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.B2_ENDPOINT_URL,
        aws_access_key_id=settings.B2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.B2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


async def GeneratePresignedUploadUrl(key: str, content_type: str, expires_in: int = 900):
    try:
        client = get_storage_client()

        upload_url = client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.B2_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

        return upload_url

    except ClientError as e:
        log.info(f"B2 presigned URL generation failed: {str(e)}")
        return None
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        return None


async def GeneratePresignedDownloadUrl(
    key: str,
    expires_in: int = 900,
    filename: str | None = None,
    content_type: str | None = None,
):
    """filename makes the browser SAVE the file under that name instead of opening it."""
    try:
        client = get_storage_client()
        params = {"Bucket": settings.B2_BUCKET_NAME, "Key": key}
        if filename:
            params["ResponseContentDisposition"] = f'attachment; filename="{filename.replace(chr(34), "")}"'
        if content_type:
            params["ResponseContentType"] = content_type
        download_url = client.generate_presigned_url(
            ClientMethod="get_object",
            Params=params,
            ExpiresIn=expires_in,
        )
        return download_url
    except ClientError as e:
        log.info(f"B2 presigned download URL generation failed: {str(e)}")
        return None
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        return None


async def VerifyObjectExists(key: str):
    try:
        client = get_storage_client()
        response = client.head_object(Bucket=settings.B2_BUCKET_NAME, Key=key)
        return response.get("ContentLength")
    except ClientError as e:
        log.info(f"B2 object verification failed: {str(e)}")
        return None
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        return None

async def DeleteObject(key: str):
    try:
        client = get_storage_client()
        client.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=key)
        return True
    except ClientError as e:
        log.info(f"B2 object deletion failed: {str(e)}")
        return False
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        return False

async def UploadThumbnail(key: str, data_uri: str) -> bool:
    try:
        client = get_storage_client()

        content_type = "image/jpeg"
        if data_uri.startswith("data:") and ";base64," in data_uri:
            header, encoded = data_uri.split(",", 1)
            content_type = header[5:header.index(";")]
        else:
            encoded = data_uri

        thumbnail_bytes = base64.b64decode(encoded)

        client.put_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=key,
            Body=thumbnail_bytes,
            ContentType=content_type,
        )
        return True

    except ClientError as e:
        log.info(f"B2 thumbnail upload failed: {str(e)}")
        return False
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        return False


# ---------------------------------------------------------------------
# Helpers used by the PDF cache. boto3 is blocking, so each call runs in a thread
# and never freezes the event loop while a PDF is being uploaded.
# ---------------------------------------------------------------------
async def UploadObject(key: str, data: bytes, content_type: str) -> bool:
    def _put():
        get_storage_client().put_object(
            Bucket=settings.B2_BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    try:
        await asyncio.to_thread(_put)
        return True
    except ClientError as e:
        log.info(f"B2 object upload failed: {str(e)}")
        return False
    except Exception as e:
        log.info(f"this is a issue {str(e)}")
        return False


async def ObjectExists(key: str) -> bool:
    """True if the object is there, False if it is not.
    Any OTHER problem (bad credentials, outage) is raised, so it is never mistaken for 'missing'."""

    def _head():
        get_storage_client().head_object(Bucket=settings.B2_BUCKET_NAME, Key=key)

    try:
        await asyncio.to_thread(_head)
        return True
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


async def ListObjectKeys(prefix: str) -> list[str]:
    def _list():
        client = get_storage_client()
        keys: list[str] = []
        pages = client.get_paginator("list_objects_v2").paginate(Bucket=settings.B2_BUCKET_NAME, Prefix=prefix)
        for page in pages:
            keys.extend(obj["Key"] for obj in page.get("Contents", []))
        return keys

    return await asyncio.to_thread(_list)


async def DeleteObjects(keys: list[str]) -> bool:
    if not keys:
        return True

    def _delete():
        client = get_storage_client()
        for key in keys:
            client.delete_object(Bucket=settings.B2_BUCKET_NAME, Key=key)

    try:
        await asyncio.to_thread(_delete)
        return True
    except Exception as e:
        log.info(f"B2 bulk deletion failed: {str(e)}")
        return False