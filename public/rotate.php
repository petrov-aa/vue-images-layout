<?php

error_reporting(E_ERROR | E_PARSE);

define('UPLOAD_DIR','\\upload');

$allowedTypes = ['picture', 'video'];

if (empty($_POST['type']) || !in_array($_POST['type'], $allowedTypes)) {
  exit();
}

$path = preg_replace('/\//', DIRECTORY_SEPARATOR, $_SERVER['DOCUMENT_ROOT'] . $_POST['src']);

if ($_POST['type'] == 'picture') {

  $src = imagecreatefromjpeg($path);

  $dst = imagerotate($src, $_POST['rotate'], 75);

  imagejpeg($dst, $path);

  echo json_encode([
    'width' => imagesx($dst),
    'height' => imagesy($dst)
  ]);

} elseif ($_POST['type'] == 'video') {

  /* 1 = 90Clockwise, 2 = 90CounterClockwise */
  $transpose = intval($_POST['rotate'])/90 < 0 ? 1 : 2;

  $output = [];
  $status = -1;

  $pathParts = explode('.webm', $path);
  $pathParts[0] .= '_tmp';

  $tmpPath = implode('.webm', $pathParts);

  exec("ffmpeg -i {$path} -c:v libvpx -crf 10 -b:v 1M -vf \"transpose={$transpose}\" -c:a libvorbis {$tmpPath} -y", $output, $status);

  rename_win($tmpPath, $path);

  echo json_encode([
    'exec' => "ffmpeg -i {$path} -c:v libvpx -crf 10 -b:v 1M -vf \"transpose={$transpose}\" -c:a libvorbis {$path} -y",
    'status' => $status
  ]);

}

/*
http://stackoverflow.com/questions/30077379
*/
function rename_win($oldfile,$newfile) {
    if (!rename($oldfile,$newfile)) {
        if (copy ($oldfile,$newfile)) {
            unlink($oldfile);
            return TRUE;
        }
        return FALSE;
    }
    return TRUE;
}
