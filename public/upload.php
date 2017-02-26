<?php

define('UPLOAD_DIR','\\upload');

$allowedTypes = ['picture', 'video'];

ini_set('post_max_size', '64M');
ini_set('upload_max_filesize', '64M');

if (empty($_FILES)) {

  return json_encode([
    'result' => 0
  ]);

  exit();
}

if (empty($_POST['type'] || in_array($_POST['type'], $allowedTypes))) {
  echo response();
  exit();
}

$fileDir = '\\';

switch ($_POST['type']) {
  case 'picture':
    $fileDir = '\\images\\';
    break;

  case 'video':
    $fileDir = '\\videos\\';
    break;

}

$filePath = UPLOAD_DIR . $fileDir . md5((new DateTime())->getTimestamp() . '_' . mt_rand());

$res = null;
if ($_POST['type'] == 'picture') {
  $res = processImage($_FILES['file']['tmp_name'], $filePath);
} elseif ($_POST['type'] == 'video') {
  $res = processVideo($_FILES['file']['tmp_name'], $filePath);
}


if ($res) {
  echo response(true, [
    'upload' => [
      'type' => $_POST['type'],
      'info' => $res
    ]
  ]);
} else {
  echo response();
}

function response($code = false, $content = []) {

  $response = [];

  if (!$code) {
    $response['result'] = 0;
  } else {
    $response['result'] = 1;
    $response = array_merge($response, $content);
  }

  return json_encode($response);

}

function absolutePath($relativePath) {
  global $_SERVER;
  return $_SERVER['DOCUMENT_ROOT'] . $relativePath;
}

function processImage($imgPathTmp, $imgRelativePath) {

  $imgPath = absolutePath($imgRelativePath . '.jpg');

  $img_src = null;
  $img_dst = null;

  $type = exif_imagetype($imgPathTmp);

  switch ($type) {

    case IMAGETYPE_JPEG:
      $img_src = imagecreatefromjpeg($imgPathTmp);
      break;

  }

  if (!$img_src) {
    return false;
  }

  $src_w = imagesx($img_src);
  $src_h = imagesy($img_src);

  /*
    Find the least side and make it as 1000px long.
    This is used in future image rotation
  */
  if ($src_h < $src_w) {
    $dst_h = 1000;
    $scaleFactor = $dst_h / $src_h;
    $dst_w = (int)($src_w * $scaleFactor);
  } else {
    $dst_w = 1000;
    $scaleFactor = $dst_w / $src_w;
    $dst_h = (int)($src_w * $scaleFactor);
  }

  $img_dst = imagecreatetruecolor($dst_w, $dst_h);

  imagecopyresized($img_dst, $img_src, 0, 0, 0, 0, $dst_w, $dst_h, $src_w, $src_h);

  if (imagejpeg($img_dst, $imgPath, 80)) {
    return [
      'width' => $dst_w,
      'height' => $dst_h,
      'path' => preg_replace('/\\\\/', '/', $imgRelativePath) . '.jpg'
    ];
  }

  return false;

}

function processVideo($videoPathTmp, $videoRelativePath) {

  $videoPath = absolutePath($videoRelativePath . '.webm');

  $output = [];
  $status = -1;

  exec("ffmpeg -i {$videoPathTmp} -c:v libvpx -crf 10 -b:v 1M -c:a libvorbis {$videoPath}", $output, $status);

  return [
    'status' => $status,
    'path' => preg_replace('/\\\\/', '/', $videoRelativePath  . '.webm')
  ];

}
