"""MinIO / S3-compatible object storage abstraction."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

import boto3
from botocore.client import Config as BotoConfig

if TYPE_CHECKING:
    import botocore.client

from backend.config import get_config

logger = logging.getLogger(__name__)


def _get_s3_client() -> "botocore.client.BaseClient":
    """Create a boto3 S3 client configured for the storage backend."""
    cfg = get_config().storage
    return boto3.client(
        "s3",
        endpoint_url=cfg.endpoint,
        aws_access_key_id=cfg.access_key,
        aws_secret_access_key=cfg.secret_key,
        region_name=cfg.region,
        config=BotoConfig(signature_version="s3v4"),
    )


async def upload_file(local_path: Path, storage_key: str) -> str:
    """Upload a local file to object storage.

    Args:
        local_path: Path to the file on disk.
        storage_key: The key (path) to use inside the bucket.

    Returns:
        The storage key on success.
    """
    # TODO: Move to async (aioboto3) for true non-blocking I/O.
    bucket = get_config().storage.bucket
    client = _get_s3_client()
    client.upload_file(str(local_path), bucket, storage_key)
    logger.info("Uploaded %s → s3://%s/%s", local_path, bucket, storage_key)
    return storage_key


async def download_file(storage_key: str, local_path: Path) -> Path:
    """Download a file from object storage to a local path.

    Returns:
        The local path of the downloaded file.
    """
    bucket = get_config().storage.bucket
    client = _get_s3_client()
    client.download_file(bucket, storage_key, str(local_path))
    logger.info("Downloaded s3://%s/%s → %s", bucket, storage_key, local_path)
    return local_path


async def get_presigned_url(storage_key: str, expires_in: int = 3600) -> str:
    """Generate a pre-signed GET URL for a stored object.

    Args:
        storage_key: Object key in the bucket.
        expires_in: Seconds until the URL expires (default 1 hour).

    Returns:
        A pre-signed URL string.
    """
    bucket = get_config().storage.bucket
    client = _get_s3_client()
    url: str = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": storage_key},
        ExpiresIn=expires_in,
    )
    return url
