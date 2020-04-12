<?php
$pass = "enlexp";
session_start();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1256" /></head><body>
<?php
if (empty($_POST['pass'])) {$_POST['pass']='';}
if ( $_SESSION['pass']!== $pass)
{
    if ($_POST['pass'] == $pass) { $_SESSION['pass'] = $pass; }
    else
    {
        echo '<form action="" method="post">
        Input password : <input name="pass" type="password"><input type="submit"></form>';
        exit;
    }
}
?>

<?php
if (empty($_POST["filter"])) {
  $filter = '*';
} else { $filter = $_POST["filter"]; }
?>

<form action="" method="POST">
Specify filename filter:
<input name="filter" type="text" <?php echo ' value="'.$filter.'" ';?>>
<input name="pass" type="hidden" <?php echo ' value="'.$pass.'" ';?>>
<input type="submit"></form>
<br>

<?php

date_default_timezone_set('America/Chicago');

if (isset($_GET['dir'])) {
  $datadir = $_GET['dir'];
} else {
  $datadir = 'data01';
}

$matches = glob( $datadir.'/'.$filter );

if ( is_array ( $matches ) == false) { $matches = array($matches); }
$filedata = array();
foreach ($matches as $filename) {
  $tmpdata[] = array();
  $tmpdata['name'] = basename($filename);
  $tmpdata['size'] = filesize($filename);
  $tmpdata['mtime'] = filemtime($filename);
  $tmpdata['date'] = date ("Y F d H:i:s.", filemtime($filename));
  array_push($filedata, $tmpdata);
}
usort( $filedata, function( $a, $b ) { return $b['mtime'] - $a['mtime']; } );

$indexCount = count($matches);
echo "$indexCount files with the filter: $filter <br><br>";
sort($matches);

echo "<TABLE border=1 cellpadding=5 cellspacing=0 class=whitelinks><TR><TH>Filename</TH><TH>Size</TH><TH>Last modified</TH></TR>\n";
foreach ($filedata as $eachfile) {
  echo "<TR>
  <td>".$eachfile['name']."</td>
  <td>".$eachfile['size']."</td>
  <td>".$eachfile['date']."</td></TR>\n";
}
echo "</TABLE>";

?>
